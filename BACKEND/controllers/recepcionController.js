const db = require('../config/db');

//METODO POST ACTA DE RECEPCIÓN
exports.recepcionActa = async (req, res) => {
    const {idUsuarios, idEmpleados, idReceptores, descripcion, items } = req.body;
    const connection = await db.getConnection();

    try{
        await connection.beginTransaction();

        //OBTENER DATOS DEL RESPONSABLE
        const [userData] = await connection.query(
            'SELECT nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?',
             [idUsuarios]
        );
        if (userData.length === 0) {
            throw new Error('Usuario no encontrado');
        }
        const responsable = userData[0];

        //OBTENER RECEPTOR
        let nombreReceptor = 'Desconocido';
        
        if (idReceptores) {
            const [recepData] = await connection.query('SELECT nomRec FROM receptores WHERE idReceptores = ?',[idReceptores]);

            if (recepData.length > 0) nombreReceptor = recepData[0].nomRec;
                } else if (idEmpleados) {
                    const [empData] = await connection.query('SELECT nomEmp FROM empleados WHERE idEmpleados = ?',[idEmpleados]);
                    if (empData.length > 0)  nombreReceptor = empData[0].nomEmp;  
                }

        //CORRELATIVO (IT - 2026 - 001)
        const anioActual = new Date().getFullYear();
        const prefijo = 'IT';
        
        const [ultimaActa] = await connection.query(
            `SELECT correla_ARCEnc FROM acta_recepcion_encabezado 
             WHERE correla_ARCEnc LIKE ? ORDER BY idActa_RecepcionEnc DESC LIMIT 1`,
            [`${prefijo}-${anioActual}-%`]
        );

        let siguienteNumero = 1;
        if (ultimaActa.length > 0) {
            const partes = ultimaActa[0].correla_ARCEnc.split('-');
            siguienteNumero = parseInt(partes[2]) + 1;
        }

        const nuevoCorrelativo = `${prefijo}-${anioActual}-${String(siguienteNumero).padStart(3, '0')}`;

        //INSERTAR ENCABEZADO
        const queryEncabezado = `
            INSERT INTO acta_recepcion_encabezado 
            (correla_ARCEnc, idUsuarios, idReceptores, idEmpleados, desc_ARCEnc, est_ARCEnc) 
            VALUES (?, ?, ?, ?, ?, 'Borrador')`;

        const [resEncabezado] = await connection.query(queryEncabezado, [
            nuevoCorrelativo, 
            idUsuarios, 
            idReceptores || null, 
            idEmpleados || null, 
            descripcion
        ]);

        const idNuevoEncabezado = resEncabezado.insertId;

        //INSERTAR DETALLES
        if (items && items.length > 0) {
            const valoresDetalle = [];

        for (const item of items) {
            valoresDetalle.push([
                idNuevoEncabezado,
                item.descr_prod,
                item.precio_prod || 0.00,
                item.num_recibo || '',
                item.num_fact || '',
                item.fech_ARCDet || new Date(),
                item.idEquipo || null
            ]);
        }

        const queryDetalle = `
            INSERT INTO acta_recepcion_detalle 
            (idActa_RecepcionEnc, descr_prod, precio_prod, num_recibo, num_fact, fech_ARCDet, idEquipo) VALUES ?`;
            await connection.query(queryDetalle, [valoresDetalle]);
    }
        await connection.commit();

        res.status(201).json({ 
        mensaje: "Acta de recepción creada exitosamente", 
        correlativo: nuevoCorrelativo, 
        id: idNuevoEncabezado,
        documentoPreview: {
            parrafoIntro: `Yo, ${responsable.nomUsu.toUpperCase()}, ${responsable.cargoUsu}, por este medio hago constar que hemos recibido por parte de ${nombreReceptor.toUpperCase()} el producto descrito a continuación.`,
                firmaUnica: {
                    nombre: responsable.nomUsu,
                    cargo: responsable.cargoUsu
                }
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al procesar acta de recepción:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
}

//METODO GET ACTA DE RECEPCIÓN
exports.obtenerActasRecepcion = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const query = `
            SELECT 
                a.idActa_RecepcionEnc AS id,
                a.correla_ARCEnc AS correlativo,
                a.desc_ARCEnc AS descripcion,
                a.est_ARCEnc AS estado,
                u.nomUsu AS responsableNombre,
                u.cargoUsu AS responsableCargo,
                COALESCE(e.nomEmp, r.nomRec, 'Desconocido') AS entregaNombre
            FROM acta_recepcion_encabezado a
            LEFT JOIN usuarios u ON a.idUsuarios = u.idUsuarios
            LEFT JOIN empleados e ON a.idEmpleados = e.idEmpleados
            LEFT JOIN receptores r ON a.idReceptores = r.idReceptores
            ORDER BY a.idActa_RecepcionEnc DESC
        `;

        const [resultados] = await connection.query(query);

        res.status(200).json(resultados);

    } catch (error) {
        console.error('Error al obtener actas de recepción:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};