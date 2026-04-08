const db = require("../config/db");

// METODO POST MEMORANDUM
exports.crearMemorandum = async (req, res) => {
  const { idUsuarios, idEmpleados, idReceptores, asunto_MMEnc, items } =
    req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // OBTENER DATOS DEL USUARIO
    let emisor = {};
    let idUsuarioFinal = idUsuarios;

    if (idUsuarios) {
      const [userData] = await connection.query(
        "SELECT idUsuarios, nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?",
        [idUsuarios],
      );
      if (userData.length === 0)
        throw new Error("Usuario emisor no encontrado");
      emisor = userData[0];
    } else {
      const [jefeData] = await connection.query(
        'SELECT idUsuarios, nomUsu, cargoUsu FROM usuarios WHERE cargoUsu = "Jefe Infotecnología" LIMIT 1',
      );
      if (jefeData.length === 0)
        throw new Error("No se encontró al Jefe de Infotecnología en la BD");
      emisor = jefeData[0];
      idUsuarioFinal = emisor.idUsuarios;
    }

    // OBTENER RECEPTOR
    let nombreReceptor = "Desconocido";
    let cargoReceptor = "S/C";

    if (idEmpleados) {
      // ← JOIN con oficina para obtener el cargo, igual que en actasController
      const [empData] = await connection.query(
        `SELECT e.nomEmp, o.cargoOfi
                 FROM empleados e
                 JOIN oficina o ON e.idOficina = o.idOficina
                 WHERE e.idEmpleados = ?`,
        [idEmpleados],
      );
      if (empData.length > 0) {
        nombreReceptor = empData[0].nomEmp;
        cargoReceptor = empData[0].cargoOfi;
      }
    } else if (idReceptores) {
      const [recepData] = await connection.query(
        "SELECT nomRec, emprRec FROM receptores WHERE idReceptores = ?",
        [idReceptores],
      );
      if (recepData.length > 0) {
        nombreReceptor = recepData[0].nomRec;
        cargoReceptor = recepData[0].emprRec;
      }
    }

    // CORRELATIVO (IT-2026-001)
    const anioActual = new Date().getFullYear();
    const prefijo = "IT";

    const [ultimaActa] = await connection.query(
      `SELECT correla_MMEnc FROM memorandum_encabezado
             WHERE correla_MMEnc LIKE ? ORDER BY idMemoEnc DESC LIMIT 1`,
      [`${prefijo}-${anioActual}-%`],
    );

    let siguienteNumero = 1;
    if (ultimaActa.length > 0) {
      const partes = ultimaActa[0].correla_MMEnc.split("-");
      siguienteNumero = parseInt(partes[2]) + 1;
    }
    const nuevoCorrelativo = `${prefijo}-${anioActual}-${String(siguienteNumero).padStart(3, "0")}`;

    // INSERTAR ENCABEZADO
    const [resEncabezado] = await connection.query(
      `INSERT INTO memorandum_encabezado
             (correla_MMEnc, idUsuarios, idReceptores, idEmpleados, asunto_MMEnc, fech_MMEnc, est_MMEnc)
             VALUES (?, ?, ?, ?, ?, NOW(), 'Borrador')`,
      [
        nuevoCorrelativo,
        idUsuarioFinal,
        idReceptores || null,
        idEmpleados || null,
        asunto_MMEnc,
      ],
    );
    const idNuevoEncabezado = resEncabezado.insertId;

    // INSERTAR DETALLES
    if (items && items.length > 0) {
      const valoresDetalle = items.map((item) => [
        idNuevoEncabezado,
        item.desc_MMDet,
      ]);
      await connection.query(
        "INSERT INTO memorandum_detalle (idMemoEnc, desc_MMDet) VALUES ?",
        [valoresDetalle],
      );
    }

    await connection.commit();

    res.status(201).json({
      mensaje: "Memorándum creado exitosamente",
      correlativo: nuevoCorrelativo,
      id: idNuevoEncabezado,
      documentoPreview: {
        parrafoIntro: `De: ${emisor.nomUsu.toUpperCase()} - ${emisor.cargoUsu}\nPara: ${nombreReceptor.toUpperCase()} - ${cargoReceptor}\nAsunto: ${asunto_MMEnc}\n\n${(items || []).map((item, i) => `${i + 1}. ${item.desc_MMDet}`).join("\n")}`,
        firmaUnica: {
          nombre: emisor.nomUsu,
          cargo: emisor.cargoUsu,
        },
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear memorándum:", error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// METODO GET MEMORANDUM (listado)
exports.obtenerMemorandums = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const [resultados] = await connection.query(`
            SELECT
                m.idMemoEnc       AS id,
                m.correla_MMEnc   AS correlativo,
                m.fech_MMEnc      AS fecha,
                m.est_MMEnc       AS estado,
                m.asunto_MMEnc    AS asunto,
                u.nomUsu          AS emisorNombre,
                COALESCE(e.nomEmp,  r.nomRec,  'Desconocido') AS receptorNombre,
                COALESCE(o.cargoOfi, r.emprRec, 'S/C')        AS receptorCargo
            FROM memorandum_encabezado m
            LEFT JOIN usuarios u    ON m.idUsuarios   = u.idUsuarios
            LEFT JOIN empleados e   ON m.idEmpleados  = e.idEmpleados
            LEFT JOIN oficina o     ON e.idOficina    = o.idOficina
            LEFT JOIN receptores r  ON m.idReceptores = r.idReceptores
            ORDER BY m.idMemoEnc DESC
        `);
    res.status(200).json(resultados);
  } catch (error) {
    console.error("Error al obtener memorándums:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// METODO GET MEMORANDUM por ID (detalle para vista)
exports.obtenerMemorandumPorId = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    const [encData] = await connection.query(
      "SELECT * FROM memorandum_encabezado WHERE idMemoEnc = ?",
      [id],
    );
    if (encData.length === 0)
      return res.status(404).json({ error: "Memorándum no encontrado" });

    const enc = encData[0];

    const [userData] = await connection.query(
      "SELECT nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?",
      [enc.idUsuarios],
    );
    const emisor = userData[0] || { nomUsu: "Desconocido", cargoUsu: "S/C" };

    let nombreReceptor = "Desconocido";
    let cargoReceptor = "";

    if (enc.idEmpleados) {
      const [empData] = await connection.query(
        `SELECT e.nomEmp, o.cargoOfi
                 FROM empleados e
                 JOIN oficina o ON e.idOficina = o.idOficina
                 WHERE e.idEmpleados = ?`,
        [enc.idEmpleados],
      );
      if (empData.length > 0) {
        nombreReceptor = empData[0].nomEmp;
        cargoReceptor = empData[0].cargoOfi;
      }
    } else if (enc.idReceptores) {
      const [recData] = await connection.query(
        "SELECT nomRec, emprRec FROM receptores WHERE idReceptores = ?",
        [enc.idReceptores],
      );
      if (recData.length > 0) {
        nombreReceptor = recData[0].nomRec;
        cargoReceptor = recData[0].emprRec;
      }
    }

    const [detalles] = await connection.query(
      "SELECT * FROM memorandum_detalle WHERE idMemoEnc = ?",
      [id],
    );

    res.status(200).json({
      id: parseInt(id),
      correlativo: enc.correla_MMEnc,
      fecha: enc.fech_MMEnc,
      estado: enc.est_MMEnc,
      asunto: enc.asunto_MMEnc,
      emisor: { nombre: emisor.nomUsu, cargo: emisor.cargoUsu },
      receptor: { nombre: nombreReceptor, cargo: cargoReceptor },
      items: detalles,
    });
  } catch (error) {
    console.error("Error al obtener memorándum por id:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};
