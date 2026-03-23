const db = require("../config/db");

//PARA OBTENER EMPLEADOS
exports.getEmpleados = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT idEmpleados, nomEmp
      FROM empleados
      WHERE nomEmp IS NOT NULL 
        AND nomEmp != ""
        AND estEmp = 'Activo'
      ORDER BY nomEmp
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los empleados" });
  }
};

//PARA OBTENER LA OFICINA, UNIDAD, CARGO PARA LOS SELECTS EN EL FRONTEND
exports.getOficinas = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT idOficina, nomOficina, unidad, cargoOfi FROM oficina WHERE nomOficina IS NOT NULL",
    );
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener los datos de la oficina" });
  }
};

//AGREGAR OFICINA, UNIDAD, CARGO
exports.createOficina = async (req, res) => {
  try {
    const { nomOficina, unidad, cargoOfi } = req.body;
    if (!nomOficina || !unidad || !cargoOfi) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }
    const [result] = await db.query(
      "INSERT INTO oficina (nomOficina, unidad, cargoOfi) VALUES (?, ?, ?)",
      [nomOficina, unidad, cargoOfi],
    );
    const [nueva] = await db.query(
      "SELECT * FROM oficina WHERE idOficina = ?",
      [result.insertId],
    );
    res.status(201).json(nueva[0]);
  } catch (error) {
    console.error("Error creando oficina:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

//PARA OBTENER LOS TIPOS DE EQUIPO, MARCAS Y MODELOS PARA LOS SELECTS EN EL FRONTEND
exports.getTiposEquipo = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT tipo FROM equipo WHERE tipo IS NOT NULL AND tipo != ""',
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los tipos" });
  }
};

exports.getMarcas = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT marca FROM equipo WHERE marca IS NOT NULL AND marca != ""',
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener las marcas" });
  }
};

exports.getModelos = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT modelo FROM equipo WHERE modelo IS NOT NULL AND modelo != ""',
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los modelos" });
  }
};
