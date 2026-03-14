const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");

// Obtener usuarios
router.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT idUsuarios, nomUsu, cargoUsu, corUsu FROM usuarios"
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
    const { nomUsu, correoUsu, cargoUsu, conUsu } = req.body;

    if (!nomUsu || !correoUsu || !cargoUsu || !conUsu) {
      return res.status(400).json({
        error: "Todos los campos son obligatorios"
      });
    }

    const passwordHash = await bcrypt.hash(conUsu, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nomUsu, corUsu, cargoUsu, conUsu)
       VALUES (?, ?, ?, ?)`,
      [nomUsu, correoUsu, cargoUsu, passwordHash]
    );

    const [nuevoUsuario] = await db.query(
      `SELECT idUsuarios, nomUsu, corUsu, cargoUsu
       FROM usuarios
       WHERE idUsuarios = ?`,
      [result.insertId]
    );

    res.status(201).json(nuevoUsuario[0]);
  } catch (error) {
    console.error("Error creando usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;