const db = require("../config/db");

// POST — crear pase de salida
exports.paseSalida = async (req, res) => {
  const {
    idEmpleados,
    idReceptores,
    emp_PSEnc,
    motivo_PSEnc,
    titulo_PSEnc,
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
    if (userData.length === 0) throw new Error("Usuario no encontrado");
    const emisor = userData[0];

    let nombreReceptor = "Desconocido";
    let empresaReceptor = emp_PSEnc || "S/C";

    if (idReceptores) {
      const [recepData] = await connection.query(
        "SELECT nomRec, emprRec FROM receptores WHERE idReceptores = ?",
        [idReceptores],
      );
      if (recepData.length > 0) {
        nombreReceptor = recepData[0].nomRec;
        empresaReceptor = emp_PSEnc || recepData[0].emprRec;
      }
    } else if (idEmpleados) {
      const [empData] = await connection.query(
        `SELECT e.nomEmp, o.cargoOfi FROM empleados e
                 JOIN oficina o ON e.idOficina = o.idOficina
                 WHERE e.idEmpleados = ?`,
        [idEmpleados],
      );
      if (empData.length > 0) {
        nombreReceptor = empData[0].nomEmp;
        empresaReceptor = emp_PSEnc || empData[0].cargoOfi;
      }
    }

    const anioActual = new Date().getFullYear();
    const prefijo = "IT";

    const [ultimaActa] = await connection.query(
      `SELECT correla_PSEnc FROM pase_salida_encabezado
             WHERE correla_PSEnc LIKE ? ORDER BY idPase_SalidaEnc DESC LIMIT 1`,
      [`${prefijo}-${anioActual}-%`],
    );

    let siguienteNumero = 1;
    if (ultimaActa.length > 0) {
      const partes = ultimaActa[0].correla_PSEnc.split("-");
      siguienteNumero = parseInt(partes[2]) + 1;
    }
    const nuevoCorrelativo = `${prefijo}-${anioActual}-${String(siguienteNumero).padStart(3, "0")}`;

    const tituloPorDefecto = titulo_PSEnc || "Pase de Salida";

    const [resEncabezado] = await connection.query(
      `INSERT INTO pase_salida_encabezado
             (correla_PSEnc, idUsuarios, idReceptores, idEmpleados, emp_PSEnc, motivo_PSEnc, fech_PSEnc, est_PSEnc, titulo_PSEnc)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), 'Borrador', ?)`,
      [
        nuevoCorrelativo,
        idUsuarios,
        idReceptores || null,
        idEmpleados || null,
        empresaReceptor,
        motivo_PSEnc,
        tituloPorDefecto,
      ],
    );
    const idNuevoEncabezado = resEncabezado.insertId;

    const equiposParaFrontend = [];

    if (items && items.length > 0) {
      const valoresDetalle = items.map((item) => [
        idNuevoEncabezado,
        item.idEquipo,
      ]);

      await connection.query(
        "INSERT INTO pase_salida_detalle (idPase_SalidaEnc, idEquipo) VALUES ?",
        [valoresDetalle],
      );

      for (const item of items) {
        const [eq] = await connection.query(
          "SELECT marca, modelo, serie, numInv FROM equipo WHERE idEquipo = ?",
          [item.idEquipo],
        );
        if (eq.length > 0) {
          equiposParaFrontend.push({
            marca: eq[0].marca || "N/A",
            modelo: eq[0].modelo || "N/A",
            serie: eq[0].serie || eq[0].numInv || "N/A",
          });
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      mensaje: "Pase de salida creado exitosamente",
      correlativo: nuevoCorrelativo,
      id: idNuevoEncabezado,
      documentoPreview: {
        parrafoIntro: `Por este medio se hace entrega a ${nombreReceptor} de la Empresa ${empresaReceptor}, para que ${motivo_PSEnc} que a continuación se describe:`,
        equipos: equiposParaFrontend,
        firmas: {
          izquierda: { nombre: nombreReceptor, cargo: empresaReceptor },
          derecha: { nombre: emisor.nomUsu, cargo: emisor.cargoUsu },
        },
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al procesar pase de salida:", error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// GET — listado
exports.obtenerPaseSalida = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const [resultados] = await connection.query(`
            SELECT
                p.idPase_SalidaEnc AS id,
                p.correla_PSEnc    AS correlativo,
                p.fech_PSEnc       AS fecha,
                p.est_PSEnc        AS estado,
                p.motivo_PSEnc     AS motivo,
                u.nomUsu           AS emisorNombre,
                COALESCE(e.nomEmp, r.nomRec, 'Desconocido') AS receptorNombre,
                p.emp_PSEnc        AS empresaReceptor
            FROM pase_salida_encabezado p
            LEFT JOIN usuarios u   ON p.idUsuarios   = u.idUsuarios
            LEFT JOIN empleados e  ON p.idEmpleados  = e.idEmpleados
            LEFT JOIN receptores r ON p.idReceptores = r.idReceptores
            ORDER BY p.idPase_SalidaEnc DESC
        `);
    res.status(200).json(resultados);
  } catch (error) {
    console.error("Error al obtener pases de salida:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// GET por ID — detalle para vista
exports.obtenerPasePorId = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    const [encData] = await connection.query(
      "SELECT * FROM pase_salida_encabezado WHERE idPase_SalidaEnc = ?",
      [id],
    );
    if (encData.length === 0)
      return res.status(404).json({ error: "Pase de salida no encontrado" });

    const enc = encData[0];

    const [userData] = await connection.query(
      "SELECT nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?",
      [enc.idUsuarios],
    );
    const emisor = userData[0] || { nomUsu: "Desconocido", cargoUsu: "S/C" };

    let nombreReceptor = "Desconocido";
    if (enc.idEmpleados) {
      const [empData] = await connection.query(
        "SELECT nomEmp FROM empleados WHERE idEmpleados = ?",
        [enc.idEmpleados],
      );
      if (empData.length > 0) nombreReceptor = empData[0].nomEmp;
    } else if (enc.idReceptores) {
      const [recData] = await connection.query(
        "SELECT nomRec FROM receptores WHERE idReceptores = ?",
        [enc.idReceptores],
      );
      if (recData.length > 0) nombreReceptor = recData[0].nomRec;
    }

    // Equipos con datos completos
    const [detalles] = await connection.query(
      `SELECT d.idPase_SalidaDet, d.idEquipo,
                    e.tipo, e.marca, e.modelo, e.serie, e.numFich, e.numInv
             FROM pase_salida_detalle d
             LEFT JOIN equipo e ON d.idEquipo = e.idEquipo
             WHERE d.idPase_SalidaEnc = ?`,
      [id],
    );

    res.status(200).json({
      id: parseInt(id),
      correlativo: enc.correla_PSEnc,
      fecha: enc.fech_PSEnc,
      estado: enc.est_PSEnc,
      titulo: enc.titulo_PSEnc,
      motivo: enc.motivo_PSEnc,
      emisor: { nombre: emisor.nomUsu, cargo: emisor.cargoUsu },
      receptor: { nombre: nombreReceptor, empresa: enc.emp_PSEnc || "" },
      items: detalles,
    });
  } catch (error) {
    console.error("Error al obtener pase de salida por id:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};
