const db = require("../config/db");

// GET todas las plantillas por tipo
exports.obtenerPlantillas = async (req, res) => {
  const { tipoActa } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT idPlantilla, nombrePlantilla, tipoActa, activa,
              config, fechaCreacion, fechaModificacion
       FROM plantillas_acta
       WHERE tipoActa = ?
       ORDER BY activa DESC, fechaCreacion DESC`,
      [tipoActa.toUpperCase()],
    );

    const parsed = rows.map((r) => ({
      ...r,
      config: typeof r.config === "string" ? JSON.parse(r.config) : r.config,
    }));
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET plantilla activa por tipo, incluye fechaModificacion para el cache
exports.obtenerPlantillaActiva = async (req, res) => {
  const { tipoActa } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT idPlantilla, nombrePlantilla, tipoActa, activa,
              config, fechaModificacion
       FROM plantillas_acta
       WHERE tipoActa = ? AND activa = 1
       LIMIT 1`,
      [tipoActa.toUpperCase()],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "No hay plantilla activa" });

    const plantilla = {
      ...rows[0],
      config:
        typeof rows[0].config === "string"
          ? JSON.parse(rows[0].config)
          : rows[0].config,
    };
    res.json(plantilla);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST crear plantilla
exports.crearPlantilla = async (req, res) => {
  const { nombrePlantilla, tipoActa, config } = req.body;
  if (!nombrePlantilla || !tipoActa || !config)
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  try {
    const [result] = await db.query(
      `INSERT INTO plantillas_acta (nombrePlantilla, tipoActa, activa, config)
       VALUES (?, ?, 0, ?)`,
      [nombrePlantilla, tipoActa.toUpperCase(), JSON.stringify(config)],
    );
    res.status(201).json({ id: result.insertId, mensaje: "Plantilla creada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT actualizar plantilla
exports.actualizarPlantilla = async (req, res) => {
  const { id } = req.params;
  const { nombrePlantilla, config } = req.body;
  try {
    await db.query(
      `UPDATE plantillas_acta
       SET nombrePlantilla = ?, config = ?
       WHERE idPlantilla = ?`,
      [nombrePlantilla, JSON.stringify(config), id],
    );
    res.json({ mensaje: "Plantilla actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT activar plantilla (desactiva las demás del mismo tipo)
exports.activarPlantilla = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT tipoActa FROM plantillas_acta WHERE idPlantilla = ?",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Plantilla no encontrada" });

    await connection.query(
      "UPDATE plantillas_acta SET activa = 0 WHERE tipoActa = ?",
      [rows[0].tipoActa],
    );
    await connection.query(
      "UPDATE plantillas_acta SET activa = 1 WHERE idPlantilla = ?",
      [id],
    );
    await connection.commit();
    res.json({ mensaje: "Plantilla activada" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// DELETE eliminar (no permite borrar la activa)
exports.eliminarPlantilla = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT activa FROM plantillas_acta WHERE idPlantilla = ?",
      [id],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Plantilla no encontrada" });
    if (rows[0].activa)
      return res
        .status(400)
        .json({ error: "No se puede eliminar la plantilla activa" });

    await db.query("DELETE FROM plantillas_acta WHERE idPlantilla = ?", [id]);
    res.json({ mensaje: "Plantilla eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
