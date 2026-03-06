const db = require('../config/db');

exports.getListaCatalogos = async (req, res) => {
    try {
        // Traemos solo ID y Nombre para los Listbox
        const [usuarios] = await db.query('SELECT idUsuarios as id, nomUsu as nombre FROM usuarios');
        const [receptores] = await db.query('SELECT idReceptores as id, nomRec as nombre FROM receptores');
        const [empleados] = await db.query('SELECT idEmpleados as id, nomEmp as nombre FROM empleados');
        const [equipos] = await db.query('SELECT idEquipo as id, tipo_E as nombre FROM equipo');

        res.json({ usuarios, receptores, empleados, equipos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};