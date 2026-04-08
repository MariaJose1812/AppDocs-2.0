const db = require("../config/db");

const obtenerHistorial = async (req, res) => {
  try {
    const query = `
      SELECT
        'ENTREGA'         AS tipo,
        'Acta de Entrega' AS tipo_nombre,
        a.idActa_EntregaEnc AS id,
        a.fech_AEEnc        AS fecha,
        a.correla_AEEnc     AS correlativo,
        u.nomUsu            AS usuario,
        a.asunto_AEEnc      AS asunto
      FROM acta_entrega_encabezado a
      LEFT JOIN usuarios u ON a.idUsuarios = u.idUsuarios

      UNION ALL

      SELECT
        'RETIRO'          AS tipo,
        'Acta de Retiro'  AS tipo_nombre,
        a.idActa_RetiroEnc AS id,
        a.fech_AREnc       AS fecha,
        a.correla_AREnc    AS correlativo,
        u.nomUsu           AS usuario,
        a.asunto_AREnc     AS asunto
      FROM acta_retiro_encabezado a
      LEFT JOIN usuarios u ON a.idUsuarios = u.idUsuarios

      UNION ALL

      SELECT
        'RECEPCION'           AS tipo,
        'Acta de Recepción'   AS tipo_nombre,
        a.idActa_RecepcionEnc AS id,
        a.fech_ARCEnc         AS fecha,
        a.correla_ARCEnc      AS correlativo,
        u.nomUsu              AS usuario,
        a.desc_ARCEnc         AS asunto
      FROM acta_recepcion_encabezado a
      LEFT JOIN usuarios u ON a.idUsuarios = u.idUsuarios

      UNION ALL

      SELECT
        'MEMORANDUM'      AS tipo,
        'Memorándum'      AS tipo_nombre,
        a.idMemoEnc       AS id,
        a.fech_MMEnc      AS fecha,
        a.correla_MMEnc   AS correlativo,
        u.nomUsu          AS usuario,
        a.asunto_MMEnc    AS asunto
      FROM memorandum_encabezado a
      LEFT JOIN usuarios u ON a.idUsuarios = u.idUsuarios

      UNION ALL

      SELECT
        'OFICIO'          AS tipo,
        'Oficio'          AS tipo_nombre,
        o.idOfiEnc        AS id,
        o.fech_OFIEnc     AS fecha,
        o.correla_OFIEnc  AS correlativo,
        u.nomUsu          AS usuario,
        o.asunto_OFIEnc   AS asunto
      FROM oficios_encabezado o
      LEFT JOIN usuarios u ON o.idUsuarios = u.idUsuarios

      UNION ALL
 
      SELECT
        'PASE_SALIDA' AS tipo,
        'Pase de Salida'         AS tipo_nombre,
        p.idPase_SalidaEnc       AS id,
        p.fech_PSEnc             AS fecha,
        p.correla_PSEnc          AS correlativo,
        u.nomUsu                 AS usuario,
        p.motivo_PSEnc           AS asunto
      FROM pase_salida_encabezado p
      LEFT JOIN usuarios u ON p.idUsuarios = u.idUsuarios

      UNION ALL
 
      SELECT
        'REPORTE'         AS tipo,
        'Reporte de Daño' AS tipo_nombre,
        r.idRepEnc        AS id,
        r.fech_RpEnc      AS fecha,
        r.correla_RpEnc   AS correlativo,
        u.nomUsu                 AS usuario,
        rd.motivo_RpDet   AS asunto
      FROM reportes_encabezado r
      INNER JOIN reportes_detalle rd ON r.idRepEnc = rd.idRepEnc
      LEFT JOIN usuarios u ON r.idUsuarios = u.idUsuarios

      ORDER BY fecha DESC
      LIMIT 100
    `;

    const [historial] = await db.query(query);
    res.json(historial);
  } catch (error) {
    console.error("Error cargando el historial:", error);
    res
      .status(500)
      .json({ error: "Error al obtener el historial de documentos" });
  }
};

const obtenerDetalle = async (req, res) => {
  const { tipo, id } = req.params;

  try {
    // ── ACTA DE ENTREGA ──────────────────────────────────────────────────────
    if (tipo === "ENTREGA") {
      const [encabezado] = await db.query(
        `
        SELECT
          a.*,
          a.correla_AEEnc AS correlativo,
          a.asunto_AEEnc  AS asunto,
          a.fech_AEEnc    AS fecha,
          e.nomEmp        AS receptorNombre,
          o.cargoOfi      AS receptorCargo,
          u.nomUsu        AS usuarioCreador,
          u.cargoUsu      AS cargoCreador
        FROM acta_entrega_encabezado a
        LEFT JOIN empleados e  ON a.idEmpleados = e.idEmpleados
        LEFT JOIN oficina   o  ON e.idOficina   = o.idOficina
        LEFT JOIN usuarios  u  ON a.idUsuarios  = u.idUsuarios
        WHERE a.idActa_EntregaEnc = ?
      `,
        [id],
      );
      if (encabezado.length === 0)
        return res.status(404).json({ mensaje: "Acta no encontrada" });

      const [items] = await db.query(
        `SELECT d.*, 
            e.tipo, e.marca, e.modelo, e.serie, e.numFich, e.numInv, d.asignado_a
     FROM acta_entrega_detalle d
     LEFT JOIN equipo e ON d.idEquipo = e.idEquipo
     WHERE d.idActa_EntregaEnc = ?`,
        [id],
      );
      const descripcion = items[0]?.descripcion_AEDet || "";
      return res.json({ ...encabezado[0], items, descripcion });
    }
    // ── ACTA DE RETIRO ───────────────────────────────────────────────────────
    if (tipo === "RETIRO") {
      const [encabezado] = await db.query(
        `
        SELECT
          a.*,
          a.correla_AREnc AS correlativo,
          a.asunto_AREnc  AS asunto,
          a.fech_AREnc    AS fecha,
          e.nomEmp        AS receptorNombre,
          o.cargoOfi      AS receptorCargo,
          u.nomUsu        AS usuarioCreador,
          u.cargoUsu      AS cargoCreador
        FROM acta_retiro_encabezado a
        LEFT JOIN empleados e  ON a.idEmpleados = e.idEmpleados
        LEFT JOIN oficina   o  ON e.idOficina   = o.idOficina
        LEFT JOIN usuarios  u  ON a.idUsuarios  = u.idUsuarios
        WHERE a.idActa_RetiroEnc = ?
      `,
        [id],
      );
      if (encabezado.length === 0)
        return res.status(404).json({ mensaje: "Acta no encontrada" });

      const [items] = await db.query(
        `SELECT d.*, 
            e.tipo, e.marca, e.modelo, e.serie, e.numFich, e.numInv, d.asignado_a
     FROM acta_retiro_detalle d
     LEFT JOIN equipo e ON d.idEquipo = e.idEquipo
     WHERE d.idActa_RetiroEnc = ?`,
        [id],
      );
      const descripcion = items[0]?.descripcion_AEDet || "";
      return res.json({ ...encabezado[0], items, descripcion });
    }

    // ── ACTA DE RECEPCIÓN ────────────────────────────────────────────────────
    if (tipo === "RECEPCION") {
      const [encabezado] = await db.query(
        `
        SELECT
          a.*,
          a.correla_ARCEnc AS correlativo,
          a.desc_ARCEnc    AS asunto,
          a.fech_ARCEnc    AS fecha,
          COALESCE(e.nomEmp,   r.nomRec,   'Desconocido') AS receptorNombre,
          COALESCE(o.cargoOfi, r.emprRec,  'S/C')         AS receptorCargo,
          u.nomUsu                                         AS usuarioCreador
        FROM acta_recepcion_encabezado a
        LEFT JOIN empleados  e  ON a.idEmpleados  = e.idEmpleados
        LEFT JOIN oficina    o  ON e.idOficina    = o.idOficina
        LEFT JOIN receptores r  ON a.idReceptores = r.idReceptores
        LEFT JOIN usuarios   u  ON a.idUsuarios   = u.idUsuarios
        WHERE a.idActa_RecepcionEnc = ?
      `,
        [id],
      );
      if (encabezado.length === 0)
        return res.status(404).json({ mensaje: "Acta no encontrada" });

      const [items] = await db.query(
        `SELECT d.*, e.fech_ARCEnc AS fech_ARCDet
         FROM acta_recepcion_detalle d
         JOIN acta_recepcion_encabezado e ON d.idActa_RecepcionEnc = e.idActa_RecepcionEnc
         WHERE d.idActa_RecepcionEnc = ?`,
        [id],
      );
      return res.json({ ...encabezado[0], items });
    }

    // ── MEMORÁNDUM ───────────────────────────────────────────────────────────
    if (tipo === "MEMORANDUM") {
      const [encabezado] = await db.query(
        `
        SELECT
          a.*,
          a.correla_MMEnc AS correlativo,
          a.asunto_MMEnc  AS asunto,
          a.fech_MMEnc    AS fecha,
          COALESCE(e.nomEmp,   r.nomRec,   'Desconocido') AS receptorNombre,
          COALESCE(o.cargoOfi, r.emprRec,  'S/C')         AS receptorCargo,
          u.nomUsu                                         AS usuarioCreador
        FROM memorandum_encabezado a
        LEFT JOIN empleados  e  ON a.idEmpleados  = e.idEmpleados
        LEFT JOIN oficina    o  ON e.idOficina    = o.idOficina
        LEFT JOIN receptores r  ON a.idReceptores = r.idReceptores
        LEFT JOIN usuarios   u  ON a.idUsuarios   = u.idUsuarios
        WHERE a.idMemoEnc = ?
      `,
        [id],
      );
      if (encabezado.length === 0)
        return res.status(404).json({ mensaje: "Memorándum no encontrado" });

      const [items] = await db.query(
        `SELECT idMemoDet, desc_MMDet FROM memorandum_detalle WHERE idMemoEnc = ?`,
        [id],
      );
      return res.json({ ...encabezado[0], items });
    }

    // ── OFICIO ───────────────────────────────────────────────────────────────
    if (tipo === "OFICIO") {
      const [encabezado] = await db.query(
        `
        SELECT
          a.*,
          a.correla_OFIEnc AS correlativo,
          a.asunto_OFIEnc  AS asunto,
          a.fech_OFIEnc    AS fecha,
          COALESCE(e.nomEmp,   r.nomRec,   'Desconocido') AS receptorNombre,
          COALESCE(ofi.cargoOfi, r.emprRec, 'S/C')        AS receptorCargo,
          u.nomUsu                                         AS usuarioCreador
        FROM oficios_encabezado a
        LEFT JOIN empleados  e   ON a.idEmpleados  = e.idEmpleados
        LEFT JOIN oficina    ofi ON e.idOficina     = ofi.idOficina
        LEFT JOIN receptores r   ON a.idReceptores = r.idReceptores
        LEFT JOIN usuarios   u   ON a.idUsuarios   = u.idUsuarios
        WHERE a.idOfiEnc = ?
      `,
        [id],
      );
      if (encabezado.length === 0)
        return res.status(404).json({ mensaje: "Oficio no encontrado" });

      const [items] = await db.query(
        `SELECT idOfiDet, desc_OfiDet FROM oficios_detalle WHERE idOfiEnc = ?`,
        [id],
      );
      return res.json({ ...encabezado[0], items });
    }

    //PASE DE SALIDA
    if (tipo === "PASE_SALIDA") {
      const [encabezado] = await db.query(
        `SELECT
       a.*,
       a.correla_PSEnc  AS correlativo,
       a.titulo_PSEnc   AS titulo,
       a.motivo_PSEnc   AS asunto,
       a.fech_PSEnc     AS fecha,
       COALESCE(e.nomEmp, r.nomRec, 'Desconocido') AS receptorNombre,
       a.emp_PSEnc                                  AS receptorCargo,
       u.nomUsu                                     AS usuarioCreador
     FROM pase_salida_encabezado a
     LEFT JOIN empleados  e ON a.idEmpleados  = e.idEmpleados
     LEFT JOIN receptores r ON a.idReceptores = r.idReceptores
     LEFT JOIN usuarios   u ON a.idUsuarios   = u.idUsuarios
     WHERE a.idPase_SalidaEnc = ?`, // ← nombre correcto del PK
        [id],
      );
      if (encabezado.length === 0)
        return res
          .status(404)
          .json({ mensaje: "Pase de salida no encontrado" });

      const [items] = await db.query(
        `SELECT d.idPase_SalidaDet, d.idEquipo,
            e.tipo, e.marca, e.modelo, e.serie
     FROM pase_salida_detalle d
     LEFT JOIN equipo e ON d.idEquipo = e.idEquipo
     WHERE d.idPase_SalidaEnc = ?`,
        [id],
      );
      return res.json({ ...encabezado[0], items });
    }

    // ── REPORTE ──────────────────────────────────────────────────────────────
    if (tipo === "REPORTE") {
      const [encabezado] = await db.query(
        `
        SELECT
          r.*,
          r.correla_RpEnc   AS correlativo,
          r.fech_RpEnc      AS fecha,
          rd.motivo_RpDet   AS motivo,
          rd.diagnostic_RpDet AS diagnostico,
          rd.recomen_RpDet  AS recomendaciones,
          rd.asignado_a     AS asignado,
          e.marca           AS equipoMarca,
          e.modelo          AS equipoModelo,
          e.serie           AS equipoSerie,
          e.numFich         AS numFicha,
          e.numInv          AS numInv
        FROM reportes_encabezado r
        INNER JOIN reportes_detalle rd ON r.idRepEnc = rd.idRepEnc
        LEFT JOIN equipo e ON rd.idEquipo = e.idEquipo
        WHERE r.idRepEnc = ?
      `,
        [id],
      );
      if (encabezado.length === 0)
        return res.status(404).json({ mensaje: "Reporte no encontrado" });
      return res.json({ ...encabezado[0], items: [] });
    }
    // ── Tipo no reconocido ───────────────────────────────────────────────────
    return res
      .status(400)
      .json({ error: `Tipo de documento no reconocido: ${tipo}` });
  } catch (error) {
    console.error("Error al obtener detalle:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = { obtenerHistorial, obtenerDetalle };
