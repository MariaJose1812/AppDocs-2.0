const db = require('../config/db');

//METODO POST OFICIOS
exports.crearOficio = async (req, res) => {
    const { idUsuarios, idEmpleados, idReceptores, asunto_OFIEnc, items } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        //OBTENER DATOS DEL USUARIO
        let emisor = {};
        let idUsuarioFinal = idUsuarios;

        if (idUsuarios) {
            const [userData] = await connection.query('SELECT idUsuarios, nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?', [idUsuarios]);
            if (userData.length === 0) { throw new Error('Usuario emisor no encontrado'); }
            emisor = userData[0];
        } else {
            const [jefeData] = await connection.query('SELECT idUsuarios, nomUsu, cargoUsu FROM usuarios WHERE cargoUsu = "Jefe Infotecnología" LIMIT 1');
            if (jefeData.length === 0) throw new Error('No se encontró al Jefe de Infotecnología en la BD');
            emisor = jefeData[0];
            idUsuarioFinal = emisor.idUsuarios;
        }

        //OBTENER DATOS DEL RECEPTOR
        let nombreReceptor = 'Desconocido';
        let cargoReceptor = 'S/C';

        if (idEmpleados) {
            const [empData] = await connection.query('SELECT nomEmp, cargoEmp FROM empleados WHERE idEmpleados = ?', [idEmpleados]);
            if (empData.length > 0) { nombreReceptor = empData[0].nomEmp; cargoReceptor = empData[0].cargoEmp; }
        } else if (idReceptores) {
            const [recepData] = await connection.query('SELECT nomRec, cargoRec, emprRec FROM receptores WHERE idReceptores = ?', [idReceptores]);
            if (recepData.length > 0) { nombreReceptor = recepData[0].nomRec; cargoReceptor = recepData[0].emprRec; }
        }

        //CORRELATIVO (IT - 2026 - 001)
        const anioActual = new Date().getFullYear();
        const prefijo = 'IT';
        
        const [ultimaActa] = await connection.query(
            `SELECT correla_OFIEnc FROM oficios_encabezado 
             WHERE correla_OFIEnc LIKE ? ORDER BY idOfiEnc DESC LIMIT 1`,
            [`${prefijo}-${anioActual}-%`]
        );

        let siguienteNumero = 1;
        if (ultimaActa.length > 0) {
            const partes = ultimaActa[0].correla_OFIEnc.split('-');
            siguienteNumero = parseInt(partes[2]) + 1;
        }

        const nuevoCorrelativo = `${prefijo}-${anioActual}-${String(siguienteNumero).padStart(3, '0')}`;

        //INSERTAR ENCABEZADO
        const queryEncabezado = `
            INSERT INTO oficios_encabezado 
            (correla_OFIEnc, idUsuarios, idReceptores, idEmpleados, asunto_OFIEnc, fech_OFIEnc, est_OFIEnc) 
            VALUES (?, ?, ?, ?, ?, NOW(), 'Borrador')`;

        const [resEncabezado] = await connection.query(queryEncabezado, [
            nuevoCorrelativo, 
            idUsuarioFinal, 
            idReceptores || null, 
            idEmpleados || null, 
            asunto_OFIEnc
        ]);

        const idNuevoEncabezado = resEncabezado.insertId;

        //INSERTAR DETALLES
        if (items && items.length > 0) {
            const valoresDetalle = [];
        for (const item of items) {
            valoresDetalle.push([
                idNuevoEncabezado,
                item.desc_OfiDet
            ]);
        }

        await connection.query(
            `INSERT INTO oficios_detalle 
            (idOfiEnc, desc_OfiDet) VALUES ?`,
            [valoresDetalle]
        );
    }

        await connection.commit();

        res.status(201).json({
            mensaje: "Oficio creado exitosamente",
            correlativo: nuevoCorrelativo,
            id: idNuevoEncabezado,
            documentoPreview: {
                parrafoIntro: `Para: ${nombreReceptor.toUpperCase()} - ${cargoReceptor}\nAsunto: ${asunto_OFIEnc}\n\n${items.map((item, index) => `${index + 1}. ${item.desc_OfiDet}`).join('\n')}`,  
                firmaUnica: {
                    nombre: emisor.nomUsu,
                    cargo: emisor.cargoUsu
                }
            }
        });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al crear oficio:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release(); 
    }
};

//METODO GET OFICIOS
exports.obtenerOficios = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const query = `
            SELECT 
                o.idOfiEnc AS id,
                o.correla_OFIEnc AS correlativo,
                o.fech_OFIEnc AS fecha,
                o.est_OFIEnc AS estado,
                o.asunto_OFIEnc AS asunto,
                u.nomUsu AS emisorNombre,
                COALESCE(e.nomEmp, r.nomRec, 'Desconocido') AS receptorNombre,
                COALESCE(e.cargoEmp, r.emprRec, 'S/C') AS receptorCargo
            FROM oficios_encabezado o
            LEFT JOIN usuarios u ON o.idUsuarios = u.idUsuarios
            LEFT JOIN empleados e ON o.idEmpleados = e.idEmpleados
            LEFT JOIN receptores r ON o.idReceptores = r.idReceptores
            ORDER BY o.idOfiEnc DESC
        `;

        const [resultados] = await connection.query(query);
        res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al obtener oficios:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};