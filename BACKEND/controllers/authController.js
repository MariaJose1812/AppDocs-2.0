const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db"); 
require("dotenv").config();

const router = express.Router();

// REGISTRO
router.post("/register", async (req, res) => {
  try {
    const { nomUsu, corUsu, cargoUsu, conUsu } = req.body;

    //Validaciones básicas
    if (!nomUsu || !corUsu || !conUsu) {
      return res.status(400).json({ error: "Datos incompletos" });
    }
    if (String(conUsu).length < 8) {
      return res.status(400).json({ error: "Mínimo 8 caracteres" });
    }

    //Verificar si el correo ya existe 
    const [existingRows] = await db.query(
      "SELECT idUsuarios FROM usuarios WHERE corUsu = ? LIMIT 1",
      [corUsu]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ error: "Correo ya registrado" });
    }

    //Hashear contraseña 
    const hash = await bcrypt.hash(String(conUsu), 10);

    //Insertar nuevo usuario
    const [result] = await db.query(
      "INSERT INTO usuarios (nomUsu, corUsu, cargoUsu, conUsu) VALUES (?, ?, ?, ?)",
      [nomUsu, corUsu, cargoUsu || null, hash]
    );

    const nuevoId = result.insertId;

    //Generar Token 
    const token = jwt.sign(
      { idUsuarios: nuevoId, nomUsu, cargoUsu: cargoUsu || null, corUsu },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "24h" }
    );

    //ENVIAR RESPUESTA
    return res.status(201).json({
      success: true,
      message: "Usuario registrado con éxito",
      token,
      user: { idUsuarios: nuevoId, nomUsu, cargoUsu: cargoUsu || null, corUsu },
    });

  } catch (error) {
    console.error("Error en Registro:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { idUsuarios, conUsu } = req.body;

    if (!idUsuarios || !conUsu) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const [rows] = await db.query(
      "SELECT idUsuarios, nomUsu, cargoUsu, corUsu, conUsu FROM usuarios WHERE idUsuarios = ? AND (estado = 'Activo' OR estado IS NULL) LIMIT 1",
      [idUsuarios]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const usuario = rows[0];
        
    // Verificación de contraseña
    const esValida = await bcrypt.compare(String(conUsu), usuario.conUsu);

    if (!esValida) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    //Generar el Token JWT
    const token = jwt.sign(
      { 
        idUsuarios: usuario.idUsuarios, 
        nomUsu: usuario.nomUsu, 
        cargoUsu: usuario.cargoUsu 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "24h" }
    );

    //Responder con éxito
    return res.json({
      success: true,
      token,
      user: {
        idUsuarios: usuario.idUsuarios,
        nomUsu: usuario.nomUsu,
        cargoUsu: usuario.cargoUsu
      }
    });

  } catch (error) {
    console.error("Error en Login:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;