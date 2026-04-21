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
    res.status(500).json({ mensaje: "Error al obtener las oficinas" });
  }
};

//solo nombres de oficina (Para reportes)
exports.getOficinasUnicas = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT nomOficina FROM oficina WHERE nomOficina IS NOT NULL ORDER BY nomOficina",
    );
    res.json(rows.map((row) => ({ nomOficina: row.nomOficina })));
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener las oficinas" });
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
      "SELECT idTipo, tipo FROM catalogo_tipos ORDER BY tipo ASC",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los tipos" });
  }
};

exports.getMarcas = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT cm.idMarca, cm.marca, cm.idTipo, ct.tipo AS nomTipo
       FROM catalogo_marcas cm
       LEFT JOIN catalogo_tipos ct ON cm.idTipo = ct.idTipo
       ORDER BY ct.tipo ASC, cm.marca ASC`,
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener las marcas" });
  }
};

exports.getModelos = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT cm.idModelo, cm.modelo, cm.idMarca, ma.marca, ma.idTipo, ct.tipo AS nomTipo
       FROM catalogo_modelos cm
       LEFT JOIN catalogo_marcas ma ON cm.idMarca = ma.idMarca
       LEFT JOIN catalogo_tipos ct ON ma.idTipo = ct.idTipo
       ORDER BY ct.tipo ASC, ma.marca ASC, cm.modelo ASC`,
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
    const [result] = await db.query("INSERT INTO catalogo_tipos (tipo) VALUES (?)", [
      tipo.trim(),
    ]);
    res.json({ idTipo: result.insertId, tipo: tipo.trim() });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "El tipo ya existe." });
    res.status(500).json({ error: "Error al guardar el tipo." });
  }
};

// POST MARCA
exports.postMarca = async (req, res) => {
  const { marca, idTipo } = req.body;

  if (!marca?.trim() || !idTipo) {
    return res.status(400).json({ error: "El campo marca y el idTipo son obligatorios." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO catalogo_marcas (marca, idTipo) VALUES (?, ?)",
      [marca.trim(), idTipo],
    );
    res.json({ idMarca: result.insertId, marca: marca.trim(), idTipo });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "La marca ya existe." });
    res.status(500).json({ error: "Error al guardar la marca." });
  }
};

// POST MODELO
exports.postModelo = async (req, res) => {
  const { modelo, idMarca } = req.body;

  if (!modelo?.trim() || !idMarca) {
    return res.status(400).json({ error: "El campo modelo y el idMarca son obligatorios." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO catalogo_modelos (modelo, idMarca) VALUES (?, ?)",
      [modelo.trim(), idMarca],
    );
    res.json({ idModelo: result.insertId, modelo: modelo.trim(), idMarca });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "El modelo ya existe." });
    res.status(500).json({ error: "Error al guardar el modelo." });
  }
};

exports.getMarcasPorTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const [rows] = await db.query(
      `SELECT cm.idMarca, cm.marca
       FROM catalogo_marcas cm
       INNER JOIN catalogo_tipos ct ON cm.idTipo = ct.idTipo
       WHERE ct.tipo = ?
       ORDER BY cm.marca ASC`,
      [tipo],
    );
    res.json(rows);
  } catch (e) {
    console.error("Error filtrando marcas por tipo:", e);
    res.status(500).json({ error: "Error filtrando marcas" });
  }
};

exports.getModelosPorTipoMarca = async (req, res) => {
  try {
    const { tipo, marca } = req.params;
    const [rows] = await db.query(
      `SELECT cm.idModelo, cm.modelo
       FROM catalogo_modelos cm
       INNER JOIN catalogo_marcas ma ON cm.idMarca = ma.idMarca
       INNER JOIN catalogo_tipos ct ON ma.idTipo = ct.idTipo
       WHERE ct.tipo = ? AND ma.marca = ?
       ORDER BY cm.modelo ASC`,
      [tipo, marca],
    );
    res.json(rows);
  } catch (e) {
    console.error("Error filtrando modelos:", e);
    res.status(500).json({ error: "Error filtrando modelos" });
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
