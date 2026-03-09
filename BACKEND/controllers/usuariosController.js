const db = require('../config/db');

// Ruta para obtener todos los usuarios (para la pantalla de selección)
router.get("/usuarios", async (req, res) => {
  try {
    // Solo traemos los datos necesarios (nunca la contraseña)
    const [rows] = await db.query("SELECT idUsuarios, nomUsu, cargoUsu FROM usuarios");
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});