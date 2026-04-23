const db = require("../config/db");

// METODO POST ACTA DE RECEPCIÓN
exports.recepcionActa = async (req, res) => {
  const {
    idEmpleados,
    idReceptores,
    descripcion,
    items,
    firmante_nombre,
    firmante_cargo,
  } = req.body;
  const idUsuarios = req.usuario.idUsuarios;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [userData] = await connection.query(
      "SELECT nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?",
      [idUsuarios],
    );
    if (userData.length === 0) throw new Error("Usuario no encontrado");
    const responsable = userData[0];

    let nombreReceptor = "Desconocido";
    if (idReceptores) {
      const [recepData] = await connection.query(
        "SELECT nomRec FROM receptores WHERE idReceptores = ?",
        [idReceptores],
      );
      if (recepData.length > 0) nombreReceptor = recepData[0].nomRec;
    } else if (idEmpleados) {
      const [empData] = await connection.query(
        "SELECT nomEmp FROM empleados WHERE idEmpleados = ?",
        [idEmpleados],
      );
      if (empData.length > 0) nombreReceptor = empData[0].nomEmp;
    }

    const anioActual = new Date().getFullYear();
    const prefijo = "IT";

    const [ultimaActa] = await connection.query(
      `SELECT correla_ARCEnc FROM acta_recepcion_encabezado
       WHERE correla_ARCEnc LIKE ? ORDER BY idActa_RecepcionEnc DESC LIMIT 1`,
      [`${prefijo}-${anioActual}-%`],
    );

    let siguienteNumero = 1;
    if (ultimaActa.length > 0) {
      const partes = ultimaActa[0].correla_ARCEnc.split("-");
      siguienteNumero = parseInt(partes[2]) + 1;
    }
    const nuevoCorrelativo = `${prefijo}-${anioActual}-${String(siguienteNumero).padStart(3, "0")}`;

    const [resEncabezado] = await connection.query(
      `INSERT INTO acta_recepcion_encabezado
       (correla_ARCEnc, idUsuarios, idReceptores, idEmpleados, desc_ARCEnc, est_ARCEnc, fech_ARCEnc, firmante_nombre, firmante_cargo)
       VALUES (?, ?, ?, ?, ?, 'Borrador', NOW(), ?, ?)`,
      [
        nuevoCorrelativo,
        idUsuarios,
        idReceptores || null,
        idEmpleados || null,
        descripcion,
        firmante_nombre || null,
        firmante_cargo || null,
      ],
    );
    const idNuevoEncabezado = resEncabezado.insertId;

    if (items && items.length > 0) {
      const valoresDetalle = items.map((item) => [
        idNuevoEncabezado,
        item.descr_prod,
        item.precio_prod || 0.0,
        item.equivalente_lps || null,
        item.num_recibo || "",
        item.num_fact || "",
        item.idEquipo || null,
      ]);

      await connection.query(
        `INSERT INTO acta_recepcion_detalle
   (idActa_RecepcionEnc, descr_prod, precio_prod, equivalente_lps, num_recibo, num_fact, idEquipo)
   VALUES ?`,
        [valoresDetalle],
      );
    }

    await connection.commit();

    res.status(201).json({
      mensaje: "Acta de recepción creada exitosamente",
      correlativo: nuevoCorrelativo,
      id: idNuevoEncabezado,
      documentoPreview: {
        parrafoIntro: `Yo, ${responsable.nomUsu.toUpperCase()}, ${responsable.cargoUsu}, por este medio hago constar que hemos recibido por parte de ${nombreReceptor.toUpperCase()} el producto descrito a continuación.`,
        firmaUnica: { nombre: responsable.nomUsu, cargo: responsable.cargoUsu },
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al procesar acta de recepción:", error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// METODO GET ACTA DE RECEPCIÓN (listado)
exports.obtenerActasRecepcion = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const [resultados] = await connection.query(`
      SELECT
        a.idActa_RecepcionEnc AS id,
        a.correla_ARCEnc      AS correlativo,
        a.desc_ARCEnc         AS descripcion,
        a.est_ARCEnc          AS estado,
        u.nomUsu              AS responsableNombre,
        u.cargoUsu            AS responsableCargo,
        COALESCE(e.nomEmp, r.nomRec, 'Desconocido') AS entregaNombre
      FROM acta_recepcion_encabezado a
      LEFT JOIN usuarios u   ON a.idUsuarios   = u.idUsuarios
      LEFT JOIN empleados e  ON a.idEmpleados  = e.idEmpleados
      LEFT JOIN receptores r ON a.idReceptores = r.idReceptores
      ORDER BY a.idActa_RecepcionEnc DESC
    `);
    res.status(200).json(resultados);
  } catch (error) {
    console.error("Error al obtener actas de recepción:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// METODO GET ACTA DE RECEPCIÓN por ID (detalle para vista)
exports.obtenerRecepcionPorId = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    const [encData] = await connection.query(
      "SELECT * FROM acta_recepcion_encabezado WHERE idActa_RecepcionEnc = ?",
      [id],
    );
    if (encData.length === 0)
      return res.status(404).json({ error: "Acta no encontrada" });

    const encabezado = encData[0];

    const [userData] = await connection.query(
      "SELECT nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?",
      [encabezado.idUsuarios],
    );
    const emisor = userData[0] || { nomUsu: "Desconocido", cargoUsu: "S/C" };

    let nombreReceptor = "Desconocido";
    let cargoReceptor = "";
    let empresaReceptor = "";

    if (encabezado.idEmpleados) {
      const [empData] = await connection.query(
        `SELECT e.nomEmp, o.cargoOfi FROM empleados e
         JOIN oficina o ON e.idOficina = o.idOficina
         WHERE e.idEmpleados = ?`,
        [encabezado.idEmpleados],
      );
      if (empData.length > 0) {
        nombreReceptor = empData[0].nomEmp;
        cargoReceptor = empData[0].cargoOfi;
      }
    } else if (encabezado.idReceptores) {
      const [recData] = await connection.query(
        "SELECT nomRec, cargoRec, emprRec FROM receptores WHERE idReceptores = ?",
        [encabezado.idReceptores],
      );
      if (recData.length > 0) {
        nombreReceptor = recData[0].nomRec;
        cargoReceptor = recData[0].cargoRec;
        empresaReceptor = recData[0].emprRec || "";
      }
    }

    const [detalles] = await connection.query(
      `SELECT d.idActa_RecepcionDet, d.idActa_RecepcionEnc,
          d.descr_prod, d.precio_prod, d.equivalente_lps,
          d.num_recibo, d.num_fact, d.idEquipo,
          e.tipo, e.marca, e.modelo, e.serie
       FROM acta_recepcion_detalle d
       LEFT JOIN equipo e ON d.idEquipo = e.idEquipo
       WHERE d.idActa_RecepcionEnc = ?`,
      [id],
    );

    res.status(200).json({
      id: parseInt(id),
      correlativo: encabezado.correla_ARCEnc,
      descripcion: encabezado.desc_ARCEnc,
      estado: encabezado.est_ARCEnc,
      tipoDestinatario: encabezado.idEmpleados ? "EMPLEADO" : "RECEPTOR",
      firmante: {
        nombre: encabezado.firmante_nombre || emisor.nomUsu,
        cargo: encabezado.firmante_cargo || emisor.cargoUsu,
      },
      receptor: {
        nombre: nombreReceptor,
        cargo: cargoReceptor,
        empresa: empresaReceptor,
      },
      items: detalles,
    });
  } catch (error) {
    console.error("Error al obtener acta:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};
