const db = require("../config/db");

const obtenerHistorial = async (req, res) => {
  try {
    // Usamos UNION ALL para juntar diferentes tablas
    // LEFT JOIN nos sirve para traer el nombre del usuario desde la tabla 'usuarios'
    const query = `
            SELECT 'acta_entrega_encabezado' AS tipo, 'Acta de Entrega' AS tipo_nombre, a.idActa_EntregaEnc AS id, a.fech_AEEnc AS fecha, a.correla_AEEnc AS correlativo, u.nomUsu AS usuario, a.asunto_AEEnc AS asunto
            FROM acta_entrega_encabezado a
            LEFT JOIN usuarios u ON a.idUsuarios = u.idUsuarios
            
            UNION ALL

            SELECT 'acta_retiro_encabezado' AS tipo, 'Acta de Retiro' AS tipo_nombre, a.idActa_RetiroEnc AS id, a.fech_AREnc AS fecha, a.correla_AREnc AS correlativo, u.nomUsu AS usuario, a.asunto_AREnc AS asunto
            FROM acta_retiro_encabezado a
            LEFT JOIN usuarios u ON a.idUsuarios = u.idUsuarios

            
            ORDER BY fecha DESC
            LIMIT 50; 
        `;

    const [historial] = await db.query(query);
    res.json(historial);
  } catch (error) {
    console.error("Error cargando el historial:", error);
    res
      .status(500)
      .json({ error: "Error al obtener el historial de documentos" });
  }
};

const obtenerDetalle = async (req, res) => {
  const { tipo, id } = req.params;

  try {
    let tablaEnc, tablaDet, idNombre, idDetNombre;

    // Configuramos los nombres según el tipo de acta
    if (tipo === "ENTREGA") {
      tablaEnc = "acta_entrega_encabezado";
      tablaDet = "acta_entrega_detalle";
      idNombre = "idActa_EntregaEnc";
      idDetNombre = "idActa_EntregaEnc";
    } else {
      tablaEnc = "acta_recepcion_encabezado";
      tablaDet = "acta_recepcion_detalle";
      idNombre = "idActa_RecepcionEnc";
      idDetNombre = "idActa_RecepcionEnc";
    }

    //Consultar Encabezado
    const queryEnc = `
            SELECT a.*, e.nomEmp AS empleadoNombre, u.nomUsu AS usuarioCreador
            FROM ${tablaEnc} a
            LEFT JOIN empleados e ON a.idEmpleados = e.idEmpleado
            LEFT JOIN usuarios u ON a.idUsuarios = u.idUsuarios
            WHERE a.${idNombre} = ?
        `;

    const [encabezado] = await db.query(queryEnc, [id]);

    if (encabezado.length === 0) {
      return res.status(404).json({ mensaje: "Acta no encontrada" });
    }

    //Consultar los equipos
    const queryDet = `SELECT * FROM ${tablaDet} WHERE ${idDetNombre} = ?`;
    const [items] = await db.query(queryDet, [id]);

    res.json({
      ...encabezado[0],
      items: items,
    });
  } catch (error) {
    console.error("Error al obtener detalle:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = {
  obtenerHistorial,
  obtenerDetalle,
};
