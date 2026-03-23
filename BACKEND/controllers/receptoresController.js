const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Obtener receptores
router.get("/receptores", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT idReceptores, nomRec, corRec, emprRec, cargoRec, estRec FROM receptores",
    );
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo receptores:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Crear receptor
router.post("/receptores", async (req, res) => {
  try {
    const { nomRec, corRec, emprRec, cargoRec } = req.body;
    if (!nomRec || !corRec || !emprRec || !cargoRec) {
      return res.status(400).json({
        error: "Todos los campos son obligatorios",
      });
    }
    const [existingRows] = await db.query(
      "SELECT idReceptores FROM receptores WHERE corRec = ? LIMIT 1",
      [corRec],
    );
    if (existingRows.length > 0) {
      return res
        .status(409)
        .json({ error: "El correo ya está registrado en el sistema" });
    }
    const [result] = await db.query(
      `INSERT INTO receptores (nomRec, corRec, emprRec, cargoRec, estRec)
       VALUES (?, ?, ?, ?, 'Activo')`,
      [nomRec, corRec, emprRec, cargoRec]
    );
    const [nuevoReceptor] = await db.query(
      `SELECT idReceptores, nomRec, corRec, emprRec, cargoRec, estRec
         FROM receptores
            WHERE idReceptores = ?`,
      [result.insertId],
    );
    res.status(201).json(nuevoReceptor[0]);
  } catch (error) {
    console.error("Error creando receptor:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

//Cambiar estado del receptor (Activo - Inactivo)
router.put("/receptores/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; 

    await db.query(
      "UPDATE receptores SET estRec = ? WHERE idReceptores = ?",
      [estado, id]
    );
    res.json({ mensaje: "Estado actualizado" });
  } catch (error) {
    console.error("Error actualizando estado:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
