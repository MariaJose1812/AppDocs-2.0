//recibir datos, buscar cargos actuales, guardar todo
const db = require("../config/db");

// METODO POST ACTA DE ENTREGA Y RETIRO
exports.procesarActa = async (req, res) => {
  const {
    tipo,
    idEmpleados,
    idReceptores,
    asunto,
    descripcion,
    observacion,
    items,
  } = req.body;
  const idUsuarios = req.usuario.idUsuarios;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [userData] = await connection.query(
      "SELECT nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?",
      [idUsuarios],
    );
    const emisor = userData[0] || { nomUsu: "Desconocido", cargoUsu: "S/C" };

    let nombreReceptor = "Desconocido";
    let cargoReceptor = "S/C";
    let oficinaReceptor = "";
    let unidadReceptor = "";
    let empresaReceptor = "";

    if (idEmpleados) {
      const [empData] = await connection.query(
        `SELECT e.nomEmp, o.cargoOfi, o.nomOficina, o.unidad
     FROM empleados e
     JOIN oficina o ON e.idOficina = o.idOficina
     WHERE e.idEmpleados = ?`,
        [idEmpleados],
      );

      if (empData.length > 0) {
        nombreReceptor = empData[0].nomEmp;
        cargoReceptor = empData[0].cargoOfi;
        oficinaReceptor = empData[0].nomOficina;
        unidadReceptor = empData[0].unidad;
      }
    } else if (idReceptores) {
      const [recepData] = await connection.query(
        "SELECT nomRec, cargoRec, emprRec FROM receptores WHERE idReceptores = ?",
        [idReceptores],
      );
      if (recepData.length > 0) {
        nombreReceptor = recepData[0].nomRec;
        cargoReceptor = recepData[0].cargoRec;
        empresaReceptor = recepData[0].emprRec;
      }
    }

    const anioActual = new Date().getFullYear();
    const prefijo = "IT";
    let nuevoCorrelativo = "";
    let idNuevoEncabezado = 0;
    let itemsGuardados = [];

    const obtenerOCrearEquipo = async (item) => {
      const serieNorm = (item.serie || "S/N").trim();
 
      // Evita duplicar por número de serie
      const [existente] = await connection.query(
       "SELECT idEquipo FROM equipo WHERE serie = ? LIMIT 1",
        [serieNorm],
      );
 
      if (existente.length > 0) {
        return existente[0].idEquipo;
      }
 
      const [resNuevo] = await connection.query(
        `INSERT INTO equipo (tipo, marca, modelo, serie, numFich, numInv)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.tipo   || "No especificado",
          item.marca  || "No especificada",
          item.modelo || "No especificado",
          serieNorm,
          item.numFicha || item.numFich || item.numeroFicha || null,
          item.numInv   || item.numeroInventario            || null,
        ],
      );
      return resNuevo.insertId;
    };

    //RETIRO
    if (tipo === "RETIRO") {
      const [ultimaActa] = await connection.query(
        `SELECT correla_AREnc FROM acta_retiro_encabezado 
                 WHERE correla_AREnc LIKE ? ORDER BY idActa_RetiroEnc DESC LIMIT 1`,
        [`${prefijo}-${anioActual}-%`],
      );

      let siguienteNumero = 1;
      if (ultimaActa.length > 0) {
        const partes = ultimaActa[0].correla_AREnc.split("-");
        siguienteNumero = parseInt(partes[2]) + 1;
      }
      nuevoCorrelativo = `${prefijo}-${anioActual}-${String(siguienteNumero).padStart(3, "0")}`;

      const queryEncabezado = `
                INSERT INTO acta_retiro_encabezado 
                (correla_AREnc, idUsuarios, idReceptores, idEmpleados, asunto_AREnc, fech_AREnc, est_AREnc) 
                VALUES (?, ?, ?, ?, ?, NOW(), 'Borrador')`;

      const [resEncabezado] = await connection.query(queryEncabezado, [
        nuevoCorrelativo,
        idUsuarios,
        idReceptores || null,
        idEmpleados || null,
        asunto,
      ]);
      idNuevoEncabezado = resEncabezado.insertId;

      if (items && items.length > 0) {
        const valoresDetalle = [];

        for (const item of items) {
          const idEquipoActual = item.idEquipo || await obtenerOCrearEquipo(item);

          //SI EL EQUIPO ES NUEVO
          if (!idEquipoActual) {
            const queryNuevoEquipo = `
            INSERT INTO equipo (tipo, marca, modelo, serie, numFich, numInv) 
            VALUES (?, ?, ?, ?, ?, ?)`;
            const [resNuevoEquipo] = await connection.query(queryNuevoEquipo, [
              item.tipo || "No especificado",
              item.marca || "No especificada",
              item.modelo || "No especificado",
              item.serie || "S/N",
              item.numFich || item.numFicha || null,
              item.numInv || null,
            ]);

            idEquipoActual = resNuevoEquipo.insertId;
          }

          const descripcionFinal = descripcion || "";

          //GUARDA EN EL DETALLE USANDO EL ID
          valoresDetalle.push([
            idNuevoEncabezado,
            descripcionFinal,
            observacion || "",
            idEquipoActual,
          ]);

          itemsGuardados.push({
            idEquipo: idEquipoActual,
            descripcion: descripcionFinal,
            observacion: item.observacion,
          });
        }

        if (valoresDetalle.length > 0) {
          await connection.query(
            `INSERT INTO acta_retiro_detalle 
                        (idActa_RetiroEnc, desc_ARDet, observa_ARDet, idEquipo) VALUES ?`,
            [valoresDetalle],
          );
        }
      }

      // ENTREGA
    } else {
      const [ultimaActa] = await connection.query(
        `SELECT correla_AEEnc FROM acta_entrega_encabezado 
                 WHERE correla_AEEnc LIKE ? ORDER BY idActa_EntregaEnc DESC LIMIT 1`,
        [`${prefijo}-${anioActual}-%`],
      );

      let siguienteNumero = 1;
      if (ultimaActa.length > 0) {
        const partes = ultimaActa[0].correla_AEEnc.split("-");
        siguienteNumero = parseInt(partes[2]) + 1;
      }
      nuevoCorrelativo = `${prefijo}-${anioActual}-${String(siguienteNumero).padStart(3, "0")}`;

      const queryEncabezado = `
                INSERT INTO acta_entrega_encabezado 
                (correla_AEEnc, idUsuarios, idReceptores, idEmpleados, asunto_AEEnc, fech_AEEnc, est_AEEnc) 
                VALUES (?, ?, ?, ?, ?, NOW(), 'Borrador')`;

      const [resEncabezado] = await connection.query(queryEncabezado, [
        nuevoCorrelativo,
        idUsuarios,
        idReceptores || null,
        idEmpleados || null,
        asunto,
      ]);
      idNuevoEncabezado = resEncabezado.insertId;

      if (items && items.length > 0) {
        const valoresDetalle = [];

        for (const item of items) {
          const idEquipoActual = item.idEquipo || await obtenerOCrearEquipo(item);

          if (!idEquipoActual) {
            const queryNuevoEquipo = `
                INSERT INTO equipo (tipo, marca, modelo, serie, numFich, numInv) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [resNuevoEquipo] = await connection.query(queryNuevoEquipo, [
              item.tipo || "No especificado",
              item.marca || "No especificada",
              item.modelo || "No especificado",
              item.serie || "S/N",
              item.numeroFicha || item.numFich || item.numFicha || null,
              item.numeroInventario || item.numInv || null,
            ]);

            idEquipoActual = resNuevoEquipo.insertId;
          }

          const descripcionFinal = descripcion || "";

          valoresDetalle.push([
            idNuevoEncabezado,
            idEquipoActual,
            descripcionFinal,
            item.asignado_a || "",
            observacion || "",
          ]);

          itemsGuardados.push({
            idEquipo: idEquipoActual,
            descripcion: descripcionFinal,
            observacion: item.observacion,
          });
        }

        if (valoresDetalle.length > 0) {
          await connection.query(
            `INSERT INTO acta_entrega_detalle 
                        (idActa_EntregaEnc, idEquipo, descripcion_AEDet, asignado_a, observacion_AEDet) 
                        VALUES ?`,
            [valoresDetalle],
          );
        }
      }
    }

    await connection.commit();

    // ENVIAMOS AL FRONTEND LOS DATOS NECESARIOS PARA MOSTRAR EN EL DOCUMENTO Y FIRMAS
    res.status(201).json({
      mensaje: `Acta de ${tipo} creada exitosamente`,
      correlativo: nuevoCorrelativo,
      tipo: tipo,
      id: idNuevoEncabezado,
      datosFrontend: {
        usuarioNombre: emisor.nomUsu,
        usuarioCargo: emisor.cargoUsu,
        receptorNombre: nombreReceptor,
        receptorCargo: cargoReceptor,
        asunto: asunto,
        items: itemsGuardados,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error(`Error al procesar acta de ${tipo}:`, error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

//METODO GET ACTAS DE ENTREGA Y RETIRO
exports.obtenerActaPorId = async (req, res) => {
  const { tipo, id } = req.params;
  const connection = await db.getConnection();

  try {
    let idUsuarios,
      idEmpleados,
      idReceptores,
      asunto,
      fecha,
      estado,
      correlativo;
    let oficinaReceptor = "";
    let unidadReceptor = "";
    let empresaReceptor = "";
    let detalles = [];

    //SE BUSCA SEGÚN EL TIPO DE ACTA
    if (tipo.toUpperCase() === "RETIRO") {
      const [encData] = await connection.query(
        "SELECT * FROM acta_retiro_encabezado WHERE idActa_RetiroEnc = ?",
        [id],
      );
      if (encData.length === 0)
        return res.status(404).json({ error: "Acta de retiro no encontrada" });

      const encabezado = encData[0];
      idUsuarios = encabezado.idUsuarios;
      idEmpleados = encabezado.idEmpleados;
      idReceptores = encabezado.idReceptores;
      asunto = encabezado.asunto_AREnc;
      fecha = encabezado.fech_AREnc;
      estado = encabezado.est_AREnc;
      correlativo = encabezado.correla_AREnc;

      const [detData] = await connection.query(
        `SELECT d.idActa_RetiroDet, d.idEquipo, d.desc_ARDet,
          d.observa_ARDet,
          e.tipo, e.marca, e.modelo, e.serie, e.numFich, e.numInv
         FROM acta_retiro_detalle d
         LEFT JOIN equipo e ON d.idEquipo = e.idEquipo
         WHERE d.idActa_RetiroEnc = ?`,
        [id],
      );
      detalles = detData.map((d) => ({
        idEquipo: d.idEquipo,
        descripcion: d.desc_ARDet,
        tipo: d.tipo || "",
        marca: d.marca || "",
        modelo: d.modelo || "",
        serie: d.serie || "",
        numFicha: d.numFich || "",
        numInv: d.numInv || "",
        observacion: d.observa_ARDet,
      }));
    } else if (tipo.toUpperCase() === "ENTREGA") {
      const [encData] = await connection.query(
        "SELECT * FROM acta_entrega_encabezado WHERE idActa_EntregaEnc = ?",
        [id],
      );
      if (encData.length === 0)
        return res.status(404).json({ error: "Acta de entrega no encontrada" });

      const encabezado = encData[0];
      idUsuarios = encabezado.idUsuarios;
      idEmpleados = encabezado.idEmpleados;
      idReceptores = encabezado.idReceptores;
      asunto = encabezado.asunto_AEEnc;
      fecha = encabezado.fech_AEEnc;
      estado = encabezado.est_AEEnc;
      correlativo = encabezado.correla_AEEnc;

      const [detData] = await connection.query(
        `SELECT d.idActa_EntregaDet, d.idEquipo, d.descripcion_AEDet,
          d.asignado_a, d.observacion_AEDet,
          e.tipo, e.marca, e.modelo, e.serie, e.numFich, e.numInv
   FROM acta_entrega_detalle d
   LEFT JOIN equipo e ON d.idEquipo = e.idEquipo
   WHERE d.idActa_EntregaEnc = ?`,
        [id],
      );
      detalles = detData.map((d) => ({
        idEquipo: d.idEquipo,
        descripcion: d.descripcion_AEDet,
        tipo: d.tipo || "",
        marca: d.marca || "",
        modelo: d.modelo || "",
        serie: d.serie || "",
        numFicha: d.numFich || "",
        numInv: d.numInv || "",
        asignado_a: d.asignado_a,
        observacion: d.observacion_AEDet,
      }));
    } else {
      return res.status(400).json({
        error: 'Tipo de acta inválido en la URL. Usa "entrega" o "retiro".',
      });
    }

    // BUSCAR LOS NOMBRES DEL EMISOR Y RECEPTOR
    const [userData] = await connection.query(
      "SELECT nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?",
      [idUsuarios],
    );
    const emisor = userData[0] || { nomUsu: "Desconocido", cargoUsu: "S/C" };

    let nombreReceptor = "Desconocido";
    let cargoReceptor = "S/C";

    if (idEmpleados) {
      const [empData] = await connection.query(
        `SELECT e.nomEmp, o.cargoOfi, o.nomOficina, o.unidad
   FROM empleados e
   JOIN oficina o ON e.idOficina = o.idOficina
   WHERE e.idEmpleados = ?`,
        [idEmpleados],
      );

      if (empData.length > 0) {
        nombreReceptor = empData[0].nomEmp;
        cargoReceptor = empData[0].cargoOfi;
        oficinaReceptor = empData[0].nomOficina;
        unidadReceptor = empData[0].unidad;
      }
    } else if (idReceptores) {
      const [recepData] = await connection.query(
        "SELECT nomRec, cargoRec, emprRec FROM receptores WHERE idReceptores = ?",
        [idReceptores],
      );
      if (recepData.length > 0) {
        nombreReceptor = recepData[0].nomRec;
        cargoReceptor = recepData[0].cargoRec;
        empresaReceptor = recepData[0].emprRec;
      }
    }

    res.status(200).json({
      id: parseInt(id),
      tipo: tipo.toUpperCase(),
      correlativo: correlativo,
      fecha: fecha,
      estado: estado,
      asunto: asunto,
      descripcion: detalles[0]?.descripcion || "",
      observacion: detalles[0]?.observacion || "",
      tipoDestinatario: idEmpleados ? "EMPLEADO" : "RECEPTOR",
      emisor: {
        nombre: emisor.nomUsu,
        cargo: emisor.cargoUsu,
      },
      receptor: {
        nombre: nombreReceptor,
        cargo: cargoReceptor,
        oficina: oficinaReceptor,
        unidad: unidadReceptor,
        empresa: empresaReceptor || "",
      },
      items: detalles,
    });
  } catch (error) {
    console.error(`Error al obtener el acta de ${tipo}:`, error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al consultar el acta" });
  } finally {
    if (connection) connection.release();
  }
};
