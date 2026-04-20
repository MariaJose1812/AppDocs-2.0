const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Obtener empleados
router.get("/empleados", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        e.idEmpleados, 
        e.nomEmp, 
        e.corEmp,
        e.dniEmp,
        e.estEmp AS estado,
        o.nomOficina, 
        o.unidad, 
        o.cargoOfi AS cargoEmp
      FROM empleados e
      LEFT JOIN oficina o ON e.idOficina = o.idOficina`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo empleados:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Crear empleado
router.post("/empleados", async (req, res) => {
  try {
    let { nomEmp, corEmp, idOficina, dniEmp } = req.body;

    nomEmp = nomEmp?.trim();
    if (!nomEmp || !idOficina) {
      return res
        .status(400)
        .json({ error: "Nombre y oficina son obligatorios" });
    }

    let correoFinal = corEmp?.trim() || null;

    if (correoFinal !== null) {
      // Validar formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correoFinal)) {
        return res
          .status(400)
          .json({ error: "El formato del correo no es válido" });
      }

      const [existingRows] = await db.query(
        `SELECT e.idEmpleados, e.nomEmp 
         FROM empleados e
         WHERE e.corEmp = ? LIMIT 1`,
        [correoFinal],
      );

      if (existingRows.length > 0) {
        return res.status(409).json({
          error: `El correo ya está registrado`,
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO empleados (nomEmp, corEmp, dniEmp, idOficina, estEmp) 
       VALUES (?, ?, ?, ?, 'Activo')`,
      [nomEmp, correoFinal, dniEmp?.trim() || null, idOficina],
    );

    const [nuevoEmpleado] = await db.query(
      `SELECT 
         e.idEmpleados, e.nomEmp, e.corEmp, e.dniEmp, e.estEmp,
         o.nomOficina, o.unidad, o.cargoOfi AS cargoEmp
       FROM empleados e
       LEFT JOIN oficina o ON e.idOficina = o.idOficina
       WHERE e.idEmpleados = ?`,
      [result.insertId],
    );

    res.status(201).json(nuevoEmpleado[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }
    console.error("Error creando empleado:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Actualizar empleado
router.put("/empleados/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { nomEmp, corEmp, idOficina, dniEmp } = req.body;

    nomEmp = nomEmp?.trim();
    if (!nomEmp || !idOficina) {
      return res
        .status(400)
        .json({ error: "Nombre y oficina son obligatorios" });
    }

    let correoFinal = corEmp?.trim() || null;
    if (correoFinal !== null) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correoFinal)) {
        return res
          .status(400)
          .json({ error: "El formato del correo no es válido" });
      }

      const [existingRows] = await db.query(
        `SELECT idEmpleados FROM empleados WHERE corEmp = ? AND idEmpleados != ? LIMIT 1`,
        [correoFinal, id],
      );
      if (existingRows.length > 0) {
        return res
          .status(409)
          .json({ error: "El correo ya está registrado por otro empleado" });
      }
    }

    await db.query(
      `UPDATE empleados 
       SET nomEmp = ?, corEmp = ?, dniEmp = ?, idOficina = ?
       WHERE idEmpleados = ?`,
      [nomEmp, correoFinal, dniEmp?.trim() || null, idOficina, id],
    );

    // Obtener el empleado actualizado con los datos de oficina
    const [updated] = await db.query(
      `SELECT 
         e.idEmpleados, e.nomEmp, e.corEmp, e.dniEmp, e.estEmp,
         o.nomOficina, o.unidad, o.cargoOfi AS cargoEmp
       FROM empleados e
       LEFT JOIN oficina o ON e.idOficina = o.idOficina
       WHERE e.idEmpleados = ?`,
      [id],
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Error actualizando empleado:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Cambiar estado del empleado
router.put("/empleados/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    await db.query("UPDATE empleados SET estEmp = ? WHERE idEmpleados = ?", [
      estado,
      id,
    ]);
    res.json({ mensaje: "Estado actualizado" });
  } catch (error) {
    console.error("Error actualizando estado:", error);
    console.log("ID recibido:", id);
    console.log("Estado recibido:", estado);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
