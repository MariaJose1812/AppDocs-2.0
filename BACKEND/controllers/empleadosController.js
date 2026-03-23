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
    const { nomEmp, corEmp, idOficina, dniEmp } = req.body;

    if (!nomEmp || !corEmp || !idOficina) {
      return res.status(400).json({
        error: "Nombre, correo y oficina son obligatorios",
      });
    }

    const [existingRows] = await db.query(
      "SELECT idEmpleados FROM empleados WHERE corEmp = ? LIMIT 1",
      [corEmp],
    );
    if (existingRows.length > 0) {
      return res
        .status(409)
        .json({ error: "El correo ya está registrado en el sistema" });
    }

    const [result] = await db.query(
      `INSERT INTO empleados (nomEmp, corEmp, dniEmp, idOficina, estEmp) 
       VALUES (?, ?, ?, ?, 'Activo')`,
      [nomEmp, corEmp, dniEmp || null, idOficina],
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
    console.error("Error creando empleado:", error);
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
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;