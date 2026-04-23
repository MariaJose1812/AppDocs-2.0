const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Obtener usuarios
router.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT idUsuarios, nomUsu, cargoUsu, corUsu FROM usuarios WHERE estado = 'Activo' OR estado IS NULL"
    );

    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Crear usuario
router.post("/usuarios", async (req, res) => {
  try {
    const { nomUsu, corUsu, cargoUsu, conUsu } = req.body;

    if (!nomUsu || !corUsu || !cargoUsu || !conUsu) {
      return res.status(400).json({
        error: "Todos los campos son obligatorios",
      });
    }

    const [existingRows] = await db.query(
      "SELECT idUsuarios FROM usuarios WHERE corUsu = ? LIMIT 1",
      [corUsu],
    );

    if (existingRows.length > 0) {
      return res
        .status(409)
        .json({ error: "El correo ya está registrado en el sistema" });
    }

    const passwordHash = await bcrypt.hash(conUsu, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nomUsu, corUsu, cargoUsu, conUsu)
       VALUES (?, ?, ?, ?)`,
      [nomUsu, corUsu, cargoUsu, passwordHash],
    );

    const [nuevoUsuario] = await db.query(
      `SELECT idUsuarios, nomUsu, corUsu, cargoUsu
       FROM usuarios
       WHERE idUsuarios = ?`,
      [result.insertId],
    );

    res.status(201).json(nuevoUsuario[0]);
  } catch (error) {
    console.error("Error creando usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Eliminar usuario
router.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "UPDATE usuarios SET estado = 'Eliminado' WHERE idUsuarios = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ mensaje: "Usuario eliminado lógicamente de forma correcta" });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});


module.exports = router;
