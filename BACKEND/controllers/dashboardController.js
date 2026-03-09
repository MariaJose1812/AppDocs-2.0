const db = require('../config/db'); 

const obtenerHistorial = async (req, res) => {
    try {

        // Usamos UNION ALL para juntar diferentes tablas
        // LEFT JOIN nos sirve para traer el nombre del usuario desde la tabla 'usuarios'
        const query = `
            SELECT 'acta_entrega_encabezado' AS tipo, a.idActa_EntregaEnc AS id, a.fech_AEEnc AS fecha, a.correla_AEEnc AS correlativo, u.nomUsu AS usuario
            FROM acta_entrega_encabezado a
            LEFT JOIN usuarios u ON a.idUsuario = u.idUsuarios
            
            UNION ALL
            
            SELECT 'acta_recepcion_encabezado' AS tipo, a.idActa_RecepcionEnc AS id, a.fech_AEEnc AS fecha, a.correla_ARCEnc AS correlativo, u.nomUsu AS usuario
            FROM acta_recepcion_encabezado a
            LEFT JOIN usuarios u ON a.idUsuario = u.idUsuarios
            
            ORDER BY fecha DESC
            LIMIT 50; 
        `;

        const [historial] = await db.query(query);
        res.json(historial);

    } catch (error) {
        console.error("Error cargando el historial:", error);
        res.status(500).json({ error: "Error al obtener el historial de documentos" });
    }
};


module.exports = {
    obtenerHistorial
};