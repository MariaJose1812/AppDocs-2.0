const db = require('../config/db');

//METODO POST PASE DE SALIDA
exports.paseSalida = async (req, res) => {
    const {idUsuarios, idEmpleados, idReceptores, emp_PSEnc, motivo_PSEnc, items } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        //OBTENER DATOS DEL EMISOR
        const [userData] = await connection.query('SELECT nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?', [idUsuarios]);
        if (userData.length === 0) { throw new Error('Usuario no encontrado'); }
        const emisor = userData[0];

        //OBTENER DATOS DEL RECEPTOR
        let nombreReceptor = 'Desconocido';
        let empresaReceptor = 'S/C';

        if (idReceptores) {
            const [recepData] = await connection.query('SELECT nomRec, emprRec FROM receptores WHERE idReceptores = ?', [idReceptores]);
            if (recepData.length > 0) { nombreReceptor = recepData[0].nomRec; empresaReceptor = recepData[0].emprRec; }
        } else if (idEmpleados) {
            const [empData] = await connection.query('SELECT nomEmp, cargoEmp FROM empleados WHERE idEmpleados = ?', [idEmpleados]);
            if (empData.length > 0) { nombreReceptor = empData[0].nomEmp; empresaReceptor = empData[0].cargoEmp; }
        }

        //CORRELATIVO (IT - 2026 - 001)
        const anioActual = new Date().getFullYear();
        const prefijo = 'IT';
        
        const [ultimaActa] = await connection.query(
            `SELECT correla_PSEnc FROM pase_salida_encabezado 
             WHERE correla_PSEnc LIKE ? ORDER BY idPase_SalidaEnc DESC LIMIT 1`,
            [`${prefijo}-${anioActual}-%`]
        );

        let siguienteNumero = 1;
        if (ultimaActa.length > 0) {
            const partes = ultimaActa[0].correla_PSEnc.split('-');
            siguienteNumero = parseInt(partes[2]) + 1;
        }

        const nuevoCorrelativo = `${prefijo}-${anioActual}-${String(siguienteNumero).padStart(3, '0')}`;

        //INSERTAR ENCABEZADO
        const queryEncabezado = `
            INSERT INTO pase_salida_encabezado 
            (correla_PSEnc, idUsuarios, idReceptores, idEmpleados, emp_PSEnc, motivo_PSEnc, fech_PSEnc, est_PSEnc) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), 'Borrador')`;

        const [resEncabezado] = await connection.query(queryEncabezado, [
            nuevoCorrelativo, 
            idUsuarios, 
            idReceptores || null, 
            idEmpleados || null, 
            emp_PSEnc || empresaReceptor, 
            motivo_PSEnc
        ]);

        const idNuevoEncabezado = resEncabezado.insertId;

        //PREPARAR DATOS DE EQUIPOS PARA ENVIAR AL FRONTEND Y MOSTRAR EN EL DOCUMENTO
        const equiposParaFrontend = [];

        //INSERTAR DETALLES
        if (items && items.length > 0) {
            const valoresDetalle = [];
        for (const item of items) {
            valoresDetalle.push([
                idNuevoEncabezado,
                item.idEquipo
            ]);

        const [eq] = await connection.query('SELECT marca, modelo, serie, numInv FROM equipo WHERE idEquipo = ?', [item.idEquipo]);
                if (eq.length > 0) {
                    equiposParaFrontend.push({
                        marca: eq[0].marca || 'N/A',
                        modelo: eq[0].modelo || 'N/A',
                        sn: eq[0].serie || eq[0].nInv_E || 'N/A' 
                    });
                }
            }
            
            if (valoresDetalle.length > 0) {
                await connection.query(
                    `INSERT INTO pase_salida_detalle (idPase_SalidaEnc, idEquipo) VALUES ?`,
                    [valoresDetalle]
                );
            }
        }
        

        await connection.commit();

        res.status(201).json({ 
        mensaje: "Pase de salida creado exitosamente", 
        correlativo: nuevoCorrelativo, 
        id: idNuevoEncabezado ,
        documentoPreview: {
            parrafoIntro: `Por este medio se hace entrega a ${nombreReceptor} de la Empresa ${empresaReceptor}, para que ${motivo_PSEnc} que a continuación se describe:`,
            equipos: equiposParaFrontend,
            firmas: {
                izquierda: { nombre: nombreReceptor, cargo: empresaReceptor },
                derecha: { nombre: emisor.nomUsu, cargo: emisor.cargoUsu }
            }
        }
    });

} catch (error) {
        await connection.rollback();
        console.error('Error al procesar pase de salida:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

//METODO GET PASE DE SALIDA 
exports.obtenerPaseSalida = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const query = `
            SELECT 
                p.idPase_SalidaEnc AS id,
                p.correla_PSEnc AS correlativo,
                p.fech_PSEnc AS fecha,
                p.est_PSEnc AS estado,
                p.motivo_PSEnc AS motivo,
                u.nomUsu AS emisorNombre,
                COALESCE(e.nomEmp, r.nomRec, 'Desconocido') AS receptorNombre,
                p.emp_PSEnc AS empresaReceptor
            FROM pase_salida_encabezado p
            LEFT JOIN usuarios u ON p.idUsuarios = u.idUsuarios
            LEFT JOIN empleados e ON p.idEmpleados = e.idEmpleados
            LEFT JOIN receptores r ON p.idReceptores = r.idReceptores
            ORDER BY p.idPase_SalidaEnc DESC
        `;

        const [resultados] = await connection.query(query);

        res.status(200).json(resultados);

    } catch (error) {
        console.error('Error al obtener pases de salida:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};