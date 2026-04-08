const supabase = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

// Función para subir una imagen a Supabase Storage
const subirImagen = async (fileBuffer, originalName, mimeType) => {
  const extension = originalName.split(".").pop();
  const fileName = `${uuidv4()}.${extension}`;

  const { data, error } = await supabase.storage
    .from("reportes-evidencias")
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      cacheControl: "3600",
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("reportes-evidencias")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

// POST /actas/reporte
exports.crearReporte = async (req, res) => {
  // Se espera que recibas también el idUsuarios (desde el token o el body)
  const {
    idEquipo,
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

    // 1. Insertar el encabezado con un correlativo temporal
    const [encabezadoResult] = await connection.query(
      `INSERT INTO reportes_encabezado (fech_RpEnc, est_RpEnc, idUsuarios, correla_RpEnc)
   VALUES (NOW(), 'Borrador', ?, 'TEMP')`,
      [idUsuarioValido],
    );
    const idRepEnc = encabezadoResult.insertId;

    // 2. Generar correlativo real basado en el idRepEnc
    const año = new Date().getFullYear();
    const correlativo = `REP-${año}-${String(idRepEnc).padStart(4, "0")}`;

    // 3. Actualizar el encabezado con el correlativo real
    await connection.query(
      `UPDATE reportes_encabezado SET correla_RpEnc = ? WHERE idRepEnc = ?`,
      [correlativo, idRepEnc],
    );

    // 3. Subir imágenes y obtener URLs
    const urls = [];
    if (files && files.length) {
      for (const file of files) {
        try {
          const url = await subirImagen(
            file.buffer,
            file.originalname,
            file.mimetype,
          );
          urls.push(url);
        } catch (err) {
          console.error("Error subiendo imagen:", err);
          // Opcional: puedes lanzar error para que no se guarde el reporte sin imágenes
        }
      }
    }

    // 4. Insertar el detalle
    await connection.query(
      `INSERT INTO reportes_detalle
       (idRepEnc, idEquipo, motivo_RpDet, diagnostic_RpDet, recomen_RpDet, asignado_a, imagenes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        idRepEnc,
        idEquipo || null,
        motivo_RpDet,
        diagnostic_RpDet,
        recomen_RpDet,
        asignado_a,
        JSON.stringify(urls), // guardar como texto JSON
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
  const { id } = req.params; // idRepDet
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

    // Procesar imágenes (si existen, convertirlas de JSON string a array)
    if (reporte.imagenes && typeof reporte.imagenes === "string") {
      try {
        reporte.imagenes = JSON.parse(reporte.imagenes);
      } catch (e) {
        reporte.imagenes = [];
      }
    } else if (!reporte.imagenes) {
      reporte.imagenes = [];
    }

    // El frontend espera que 'oficina' exista; si no está en la BD, lo enviamos vacío
    // (pero si quieres guardarlo, deberías agregar la columna)
    reporte.oficina = reporte.oficina || "";

    res.json(reporte);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};
