const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db"); 
require("dotenv").config();

const router = express.Router();

// REGISTRO
router.post("/register", async (req, res) => {
  try {
    const { nomUsu, corUsu, cargoUsu, conUsu } = req.body;

    if (!nomUsu || !corUsu || !conUsu) {
      return res.status(400).json({ error: "Datos incompletos" });
    }
    if (String(conUsu).length < 8) {
      return res.status(400).json({ error: "Mínimo 8 caracteres" });
    }

    // Verifica si el correo ya existe
    db.query(
      "SELECT idUsuarios FROM usuarios WHERE corUsu = ? LIMIT 1",
      [corUsu],
      async (err, rows) => {
        if (err) return res.status(500).json({ error: "Error en servidor" });

        if (rows.length > 0) {
          return res.status(409).json({ error: "Correo ya registrado" });
        }

        // Guardar contraseña como hash 
        const hash = await bcrypt.hash(conUsu, 10);

        db.query(
          "INSERT INTO usuarios (nomUsu, corUsu, cargoUsu, conUsu) VALUES (?, ?, ?, ?)",
          [nomUsu, corUsu, cargoUsu || null, hash],
          (err2, result) => {
            if (err2) return res.status(500).json({ error: "Error en servidor" });

            const nuevoId = result.insertId;

            // Generar Token 
            const token = jwt.sign(
              { idUsuarios: nuevoId, nomUsu, cargoUsu: cargoUsu || null, corUsu },
              process.env.JWT_SECRET,
              { expiresIn: process.env.JWT_EXPIRES || "8h" }
            );

            return res.status(201).json({
              success: true,
              message: "Usuario registrado",
              token,
              user: { idUsuarios: nuevoId, nomUsu, cargoUsu: cargoUsu || null, corUsu },
            });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error en servidor" });
  }
});

// LOGIN
router.post("/login", (req, res) => {
  try {
    const { corUsu, conUsu } = req.body;

    if (!corUsu || !conUsu) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    db.query(
      "SELECT idUsuarios, nomUsu, corUsu, cargoUsu, conUsu FROM usuarios WHERE corUsu = ? LIMIT 1",
      [corUsu],
      async (err, rows) => {
        if (err) return res.status(500).json({ error: "Error en servidor" });

        if (rows.length === 0) {
          return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const usuario = rows[0];
        const esHashBcrypt = typeof usuario.conUsu === "string" && usuario.conUsu.startsWith("$2");

        let valido = false;
        if (esHashBcrypt) {
          valido = await bcrypt.compare(conUsu, usuario.conUsu);
        } else {
          // NO recomendado (solo si tu BD aún tiene contraseñas planas)
          valido = String(conUsu) === String(usuario.conUsu);
        }

        if (!valido) {
          return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Generar Token 
        const token = jwt.sign(
          {
            idUsuarios: usuario.idUsuarios,
            nomUsu: usuario.nomUsu,
            cargoUsu: usuario.cargoUsu,
            corUsu: usuario.corUsu,
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES || "8h" }
        );

        return res.json({
          success: true,
          token,
          user: {
            idUsuarios: usuario.idUsuarios,
            nomUsu: usuario.nomUsu,
            cargoUsu: usuario.cargoUsu,
            corUsu: usuario.corUsu,
          },
        });
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error en servidor" });
  }
});

module.exports = router;