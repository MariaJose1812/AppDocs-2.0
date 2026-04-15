const db = require("../config/db");
const { subirImagen } = require("../utils/supabaseStorage");

// POST /actas/reporte
exports.crearReporte = async (req, res) => {
  const {
    idEquipo,
    oficina,
    motivo_RpDet,
    diagnostic_RpDet,
    recomen_RpDet,
    asignado_a,
    idUsuarios,
  } = req.body;
  const files = req.files; // archivos de imágenes
  const connection = await db.getConnection();

  const idUsuarioValido = parseInt(idUsuarios, 10);
  if (isNaN(idUsuarioValido)) {
    return res
      .status(400)
      .json({ error: "ID de usuario inválido o no proporcionado" });
  }

  try {
    await connection.beginTransaction();

    const [encabezadoResult] = await connection.query(
      `INSERT INTO reportes_encabezado (fech_RpEnc, est_RpEnc, idUsuarios, correla_RpEnc)
       VALUES (NOW(), 'Borrador', ?, 'TEMP')`,
      [idUsuarioValido],
    );
    const idRepEnc = encabezadoResult.insertId;

    //Generar correlativo real
    const año = new Date().getFullYear();
    const correlativo = `REP-${año}-${String(idRepEnc).padStart(4, "0")}`;

    //Actualizar encabezado con el correlativo
    await connection.query(
      `UPDATE reportes_encabezado SET correla_RpEnc = ? WHERE idRepEnc = ?`,
      [correlativo, idRepEnc],
    );

    //Subir imágenes a Supabase (carpeta "reportes")
    const urls = [];
    if (files && files.length) {
      for (const file of files) {
        const url = await subirImagen(
          file.buffer,
          file.originalname,
          file.mimetype,
          "reportes", 
        );
        urls.push(url);
      }
    }

    //Insertar detalle
    await connection.query(
      `INSERT INTO reportes_detalle
       (idRepEnc, idEquipo, motivo_RpDet, diagnostic_RpDet, recomen_RpDet, asignado_a, imagenes, oficina_RpDet)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idRepEnc,
        idEquipo || null,
        motivo_RpDet,
        diagnostic_RpDet,
        recomen_RpDet,
        asignado_a,
        JSON.stringify(urls),
        oficina,
      ],
    );

    await connection.commit();

    res.status(201).json({
      mensaje: "Reporte creado exitosamente",
      idRepEnc,
      correlativo,
      imagenes: urls,
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// GET /actas/detalle/REPORTE/:id
exports.obtenerReportePorId = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT 
        rd.idRepDet,
        rd.idRepEnc,
        rd.idEquipo,
        rd.motivo_RpDet AS motivo,
        rd.diagnostic_RpDet AS diagnostico,
        rd.recomen_RpDet AS recomendaciones,
        rd.asignado_a AS asignado,
        rd.imagenes,
        rd.oficina_RpDet AS oficina,
        re.correla_RpEnc AS correlativo,
        re.fech_RpEnc AS fecha,
        re.est_RpEnc AS estado,
        e.marca AS equipoMarca,
        e.modelo AS equipoModelo,
        e.serie AS equipoSerie,
        e.numFich,
        e.numInv
      FROM reportes_detalle rd
      JOIN reportes_encabezado re ON rd.idRepEnc = re.idRepEnc
      LEFT JOIN equipo e ON rd.idEquipo = e.idEquipo
      WHERE rd.idRepEnc = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    const reporte = rows[0];

    // Procesar imágenes
    if (reporte.imagenes && typeof reporte.imagenes === "string") {
      try {
        reporte.imagenes = JSON.parse(reporte.imagenes);
      } catch (e) {
        reporte.imagenes = [];
      }
    } else if (!reporte.imagenes) {
      reporte.imagenes = [];
    }

    reporte.oficina = reporte.oficina || "";
    res.json(reporte);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};
