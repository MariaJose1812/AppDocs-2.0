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
      "SELECT tipo FROM catalogo_tipos ORDER BY tipo ASC",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los tipos" });
  }
};

exports.getMarcas = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT marca FROM catalogo_marcas ORDER BY marca ASC",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener las marcas" });
  }
};

exports.getModelos = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT modelo FROM catalogo_modelos ORDER BY modelo ASC",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los modelos" });
  }
};

// POST
exports.postTipo = async (req, res) => {
  const { tipo } = req.body;
  if (!tipo?.trim())
    return res.status(400).json({ error: "El campo tipo es obligatorio." });
  try {
    await db.query("INSERT INTO catalogo_tipos (tipo) VALUES (?)", [
      tipo.trim(),
    ]);
    res.json({ ok: true, tipo: tipo.trim() });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "El tipo ya existe." });
    res.status(500).json({ error: "Error al guardar el tipo." });
  }
};

exports.postMarca = async (req, res) => {
  const { marca } = req.body;
  if (!marca?.trim())
    return res.status(400).json({ error: "El campo marca es obligatorio." });
  try {
    await db.query("INSERT INTO catalogo_marcas (marca) VALUES (?)", [
      marca.trim(),
    ]);
    res.json({ ok: true, marca: marca.trim() });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "La marca ya existe." });
    res.status(500).json({ error: "Error al guardar la marca." });
  }
};

exports.postModelo = async (req, res) => {
  const { modelo } = req.body;
  if (!modelo?.trim())
    return res.status(400).json({ error: "El campo modelo es obligatorio." });
  try {
    await db.query("INSERT INTO catalogo_modelos (modelo) VALUES (?)", [
      modelo.trim(),
    ]);
    res.json({ ok: true, modelo: modelo.trim() });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "El modelo ya existe." });
    res.status(500).json({ error: "Error al guardar el modelo." });
  }
};

exports.getMarcasPorTipo = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT marca FROM equipo 
       WHERE tipo = ? AND marca IS NOT NULL AND marca != ''
       ORDER BY marca ASC`,
      [req.params.tipo],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getModelosPorTipoMarca = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT modelo FROM equipo 
       WHERE tipo = ? AND marca = ? AND modelo IS NOT NULL AND modelo != ''
       ORDER BY modelo ASC`,
      [req.params.tipo, req.params.marca],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmpleadosPorOficina = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.idEmpleados, e.nomEmp, o.nomOficina, o.unidad, o.cargoOfi
       FROM empleados e
       JOIN oficina o ON e.idOficina = o.idOficina
       WHERE o.nomOficina = ? AND e.estEmp = 'Activo'
       ORDER BY e.nomEmp ASC`,
      [req.params.nomOficina],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
