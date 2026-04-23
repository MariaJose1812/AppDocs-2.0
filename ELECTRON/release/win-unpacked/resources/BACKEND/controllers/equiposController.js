const db = require("../config/db");

exports.getEquipos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        e.idEquipo, 
        e.tipo, 
        e.marca, 
        e.modelo, 
        e.serie, 
        e.numFich AS numFicha, 
        e.numInv,
        CASE
          WHEN MAX(ad.idActa_EntregaDet) IS NOT NULL THEN 'Entrega'
          WHEN MAX(ar.idActa_RetiroDet) IS NOT NULL THEN 'Retiro'
          ELSE 'Sin Acta'
        END AS origen
      FROM equipo e
      LEFT JOIN acta_entrega_detalle ad ON e.idEquipo = ad.idEquipo
      LEFT JOIN acta_retiro_detalle ar ON e.idEquipo = ar.idEquipo
      GROUP BY e.idEquipo
      ORDER BY e.idEquipo DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener equipos" });
  }
};

exports.postEquipo = async (req, res) => {
  const { tipo, marca, modelo, serie, numFicha, numInv } = req.body;
  if (!tipo || !marca || !modelo || !serie) {
    return res
      .status(400)
      .json({ error: "tipo, marca, modelo y serie son obligatorios." });
  }
  try {
    const [existente] = await db.query(
      "SELECT idEquipo FROM equipo WHERE serie = ? LIMIT 1",
      [serie.trim()],
    );
    if (existente.length > 0) {
      return res.json({
        ok: true,
        idEquipo: existente[0].idEquipo,
        yaExistia: true,
      });
    }
    const [result] = await db.query(
      `INSERT INTO equipo (tipo, marca, modelo, serie, numFich, numInv) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tipo.trim(),
        marca.trim(),
        modelo.trim(),
        serie.trim(),
        numFicha?.trim() || null,
        numInv?.trim() || null,
      ],
    );
    res.json({ ok: true, idEquipo: result.insertId, yaExistia: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar el equipo." });
  }
};
