const db = require('../config/db');

// METODO POST MEMORANDUM
exports.crearMemorandum = async (req, res) => {
    const { idUsuarios, idEmpleados, idReceptores, asunto_MMEnc, items } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        //OBTENER DATOS DEL USUARIO 
        let emisor = {};
        let idUsuarioFinal = idUsuarios;

        if (idUsuarios) {
            // Si el frontend manda un usuario específico
            const [userData] = await connection.query('SELECT idUsuarios, nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?', [idUsuarios]);
            if (userData.length === 0) throw new Error('Usuario emisor no encontrado');
            emisor = userData[0];
        } else {
            // Si NO mandan usuario, buscamos al Jefe de Infotecnología por defecto
            const [jefeData] = await connection.query('SELECT idUsuarios, nomUsu, cargoUsu FROM usuarios WHERE cargoUsu = "Jefe Infotecnología" LIMIT 1');
            if (jefeData.length === 0) throw new Error('No se encontró al Jefe de Infotecnología en la BD');
            emisor = jefeData[0];
            idUsuarioFinal = emisor.idUsuarios;
        }

        //OBTENER RECEPTOR
        let nombreReceptor = 'Desconocido';
        let cargoReceptor = 'S/C';

        if (idEmpleados) {
            const [empData] = await connection.query('SELECT nomEmp, cargoEmp FROM empleados WHERE idEmpleados = ?', [idEmpleados]);
            if (empData.length > 0) { nombreReceptor = empData[0].nomEmp; cargoReceptor = empData[0].cargoEmp; }
        } else if (idReceptores) {
            const [recepData] = await connection.query('SELECT nomRec, empRec FROM receptores WHERE idReceptores = ?', [idReceptores]);
            if (recepData.length > 0) { nombreReceptor = recepData[0].nomRec; cargoReceptor = recepData[0].empRec; }
        }

        //CORRELATIVO (IT - 2026 - 001)
        const anioActual = new Date().getFullYear();
        const prefijo = 'IT';
        
        const [ultimaActa] = await connection.query(
            `SELECT correla_MMEnc FROM memorandum_encabezado 
             WHERE correla_MMEnc LIKE ? ORDER BY idMemoEnc DESC LIMIT 1`,
            [`${prefijo}-${anioActual}-%`]
        );

        let siguienteNumero = 1;
        if (ultimaActa.length > 0) {
            const partes = ultimaActa[0].correla_MMEnc.split('-');
            siguienteNumero = parseInt(partes[2]) + 1;
        }

        const nuevoCorrelativo = `${prefijo}-${anioActual}-${String(siguienteNumero).padStart(3, '0')}`;

        // INSERTAR ENCABEZADO
        const queryEncabezado = `
            INSERT INTO memorandum_encabezado 
            (correla_MMEnc, idUsuarios, idReceptores, idEmpleados, asunto_MMEnc, fech_MMEnc, est_MMEnc) 
            VALUES (?, ?, ?, ?, ?, NOW(), 'Borrador')`;

        const [resEncabezado] = await connection.query(queryEncabezado, [
            nuevoCorrelativo, 
            idUsuarioFinal, 
            idReceptores || null, 
            idEmpleados || null, 
            asunto_MMEnc
        ]);

        const idNuevoEncabezado = resEncabezado.insertId;

        // INSERTAR DETALLES
        if (items && items.length > 0) {
            const valoresDetalle = [];
            
            for (const item of items) {
                valoresDetalle.push([
                    idNuevoEncabezado,
                    item.desc_MMDet
                ]);
            }

            const queryDetalle = `
                INSERT INTO memorandum_detalle 
                (idMemoEnc, desc_MMDet) VALUES ?`;
            await connection.query(queryDetalle, [valoresDetalle]);
        }

        await connection.commit();

        res.status(201).json({
            mensaje: "Memorándum creado exitosamente",
            correlativo: nuevoCorrelativo,
            id: idNuevoEncabezado,
            documentoPreview: {
                parrafoIntro: `De: ${emisor.nomUsu.toUpperCase()} - ${emisor.cargoUsu}\nPara: ${nombreReceptor.toUpperCase()} - ${cargoReceptor}\nAsunto: ${asunto_MMEnc}\n\n${(items || []).map((item, index) => `${index + 1}. ${item.desc_MMDet}`).join('\n')}`, 
                firmaUnica: { //RECEPTOR
                    nombre: emisor.nomUsu,
                    cargo: emisor.cargoUsu
                }
            }
        });
    
    } catch (error) {
        await connection.rollback(); 
        console.error('Error al crear memorándum:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

// METODO GET MEMORANDUM
exports.obtenerMemorandums = async (req, res) => {
    const connection = await db.getConnection();

    try {
        /* Usamos LEFT JOIN para unir la tabla principal con las tablas de usuarios, empleados y receptores.
           Usamos COALESCE para que MySQL decida automáticamente: "Si hay un empleado, dame su nombre, 
           si no, dame el del receptor, y si ninguno existe, pon 'Desconocido'".
        */
        const query = `
            SELECT 
                m.idMemoEnc AS id,
                m.correla_MMEnc AS correlativo,
                m.fech_MMEnc AS fecha,
                m.est_MMEnc AS estado,
                m.asunto_MMEnc AS asunto,
                u.nomUsu AS emisorNombre,
                COALESCE(e.nomEmp, r.nomRec, 'Desconocido') AS receptorNombre,
                COALESCE(e.cargoEmp, r.emprRec, 'S/C') AS receptorCargo
            FROM memorandum_encabezado m
            LEFT JOIN usuarios u ON m.idUsuarios = u.idUsuarios
            LEFT JOIN empleados e ON m.idEmpleados = e.idEmpleados
            LEFT JOIN receptores r ON m.idReceptores = r.idReceptores
            ORDER BY m.idMemoEnc DESC
        `;

        const [resultados] = await connection.query(query);

        res.status(200).json(resultados);

    } catch (error) {
        console.error('Error al obtener la lista de memorándums:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};