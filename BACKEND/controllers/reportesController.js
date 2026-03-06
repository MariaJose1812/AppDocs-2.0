const db = require('../config/db');

//METODO POST REPORTES
exports.generarReporte = async (req, res) => {
    const { idEquipo, motivo_RpDet, diagnostic_RpDet, recomen_RpDet, asignado_a } = req.body;
    const connection = await db.getConnection();

    try{
        await connection.beginTransaction();

        //CORRELATIVO (IT - 2026 - 001)
        const anioActual = new Date().getFullYear();
        const prefijo = 'IT';
        
        const [ultimaActa] = await connection.query(
            `SELECT correla_RpEnc FROM reportes_encabezado 
             WHERE correla_RpEnc LIKE ? ORDER BY idRepEnc DESC LIMIT 1`,
            [`${prefijo}-${anioActual}-%`]
        );

        let siguienteNumero = 1;
        if (ultimaActa.length > 0) {
            const partes = ultimaActa[0].correla_RpEnc.split('-');
            siguienteNumero = parseInt(partes[2]) + 1;
        }

        const nuevoCorrelativo = `${prefijo}-${anioActual}-${String(siguienteNumero).padStart(3, '0')}`;

        //INSERTAR ENCABEZADO
        const queryEncabezado = `
            INSERT INTO reportes_encabezado 
            (correla_RpEnc, fech_RpEnc, est_RpEnc) 
            VALUES (?, NOW(), 'Borrador')`;

        const [resEncabezado] = await connection.query(queryEncabezado, [
            nuevoCorrelativo
        ]);
        const idNuevoEncabezado = resEncabezado.insertId;

        //INSERTAR DETALLES
        const queryDetalle = `
            INSERT INTO reportes_detalle 
            (idRepEnc, idEquipo, motivo_RpDet, diagnostic_RpDet, recomen_RpDet, asignado_a) 
            VALUES (?, ?, ?, ?, ?, ?)`;

        await connection.query(queryDetalle, [
            idNuevoEncabezado,
            idEquipo || null,
            motivo_RpDet || '',
            diagnostic_RpDet || '',
            recomen_RpDet || '',
            asignado_a || null 
        ]);
    
        await connection.commit();

        res.status(201).json({
            mensaje: "Reporte generado exitosamente",
            correlativo: nuevoCorrelativo,
            id: idNuevoEncabezado
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al generar reporte:', error);
        res.status(500).json({ error: error.message });
    } finally {        
        connection.release();
    }

}

//METODO GET REPORTES
exports.obtenerReportes = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const query = `
            SELECT 
                r.idRepEnc AS id,
                r.correla_RpEnc AS correlativo,
                r.fech_RpEnc AS fecha,
                r.est_RpEnc AS estado,
                rd.motivo_RpDet AS motivo,
                rd.diagnostic_RpDet AS diagnostico,
                rd.recomen_RpDet AS recomendaciones,
                rd.asignado_a AS asignado,
                e.marca AS equipoMarca,
                e.modelo AS equipoModelo,
                e.serie AS equipoSerie
            FROM reportes_encabezado r
            INNER JOIN reportes_detalle rd ON r.idRepEnc = rd.idRepEnc
            LEFT JOIN equipo e ON rd.idEquipo = e.idEquipo
            ORDER BY r.idRepEnc DESC
        `;

        const [resultados] = await connection.query(query);

        res.status(200).json(resultados);

    } catch (error) {
        console.error('Error al obtener reportes:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};