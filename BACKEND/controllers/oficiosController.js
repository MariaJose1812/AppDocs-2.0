const db = require('../config/db');

exports.crearOficio = async (req, res) => {
    const { idEmpleados, idReceptores, asunto_OFIEnc, items } = req.body;
    const idUsuarios = req.usuario.idUsuarios; // ← del token, igual que los demás
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [userData] = await connection.query(
            'SELECT idUsuarios, nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?', [idUsuarios]
        );
        if (userData.length === 0) throw new Error('Usuario no encontrado');
        const emisor = userData[0];

        let nombreReceptor = 'Desconocido';
        let cargoReceptor  = 'S/C';

        if (idEmpleados) {
            // ← JOIN con oficina, igual que actasController
            const [empData] = await connection.query(
                `SELECT e.nomEmp, o.cargoOfi
                 FROM empleados e
                 JOIN oficina o ON e.idOficina = o.idOficina
                 WHERE e.idEmpleados = ?`, [idEmpleados]
            );
            if (empData.length > 0) {
                nombreReceptor = empData[0].nomEmp;
                cargoReceptor  = empData[0].cargoOfi;
            }
        } else if (idReceptores) {
            const [recepData] = await connection.query(
                'SELECT nomRec, emprRec FROM receptores WHERE idReceptores = ?', [idReceptores]
            );
            if (recepData.length > 0) {
                nombreReceptor = recepData[0].nomRec;
                cargoReceptor  = recepData[0].emprRec;
            }
        }

        const anioActual = new Date().getFullYear();
        const prefijo    = 'IT';

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

        const [resEncabezado] = await connection.query(
            `INSERT INTO oficios_encabezado
             (correla_OFIEnc, idUsuarios, idReceptores, idEmpleados, asunto_OFIEnc, fech_OFIEnc, est_OFIEnc)
             VALUES (?, ?, ?, ?, ?, NOW(), 'Borrador')`,
            [nuevoCorrelativo, idUsuarios, idReceptores || null, idEmpleados || null, asunto_OFIEnc]
        );
        const idNuevoEncabezado = resEncabezado.insertId;

        if (items && items.length > 0) {
            const valoresDetalle = items.map(item => [idNuevoEncabezado, item.desc_OfiDet]);
            await connection.query(
                'INSERT INTO oficios_detalle (idOfiEnc, desc_OfiDet) VALUES ?',
                [valoresDetalle]
            );
        }

        await connection.commit();

        res.status(201).json({
            mensaje: "Oficio creado exitosamente",
            correlativo: nuevoCorrelativo,
            id: idNuevoEncabezado,
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al crear oficio:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

exports.obtenerOficios = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [resultados] = await connection.query(`
            SELECT
                o.idOfiEnc       AS id,
                o.correla_OFIEnc AS correlativo,
                o.fech_OFIEnc    AS fecha,
                o.est_OFIEnc     AS estado,
                o.asunto_OFIEnc  AS asunto,
                u.nomUsu         AS emisorNombre,
                COALESCE(e.nomEmp,   r.nomRec,   'Desconocido') AS receptorNombre,
                COALESCE(ofi.cargoOfi, r.emprRec, 'S/C')        AS receptorCargo
            FROM oficios_encabezado o
            LEFT JOIN usuarios u    ON o.idUsuarios   = u.idUsuarios
            LEFT JOIN empleados e   ON o.idEmpleados  = e.idEmpleados
            LEFT JOIN oficina ofi   ON e.idOficina    = ofi.idOficina
            LEFT JOIN receptores r  ON o.idReceptores = r.idReceptores
            ORDER BY o.idOfiEnc DESC
        `);
        res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al obtener oficios:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

exports.obtenerOficioPorId = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        const [encData] = await connection.query(
            'SELECT * FROM oficios_encabezado WHERE idOfiEnc = ?', [id]
        );
        if (encData.length === 0)
            return res.status(404).json({ error: 'Oficio no encontrado' });

        const enc = encData[0];

        const [userData] = await connection.query(
            'SELECT nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?', [enc.idUsuarios]
        );
        const emisor = userData[0] || { nomUsu: 'Desconocido', cargoUsu: 'S/C' };

        let nombreReceptor = 'Desconocido';
        let cargoReceptor  = '';

        if (enc.idEmpleados) {
            const [empData] = await connection.query(
                `SELECT e.nomEmp, o.cargoOfi FROM empleados e
                 JOIN oficina o ON e.idOficina = o.idOficina
                 WHERE e.idEmpleados = ?`, [enc.idEmpleados]
            );
            if (empData.length > 0) {
                nombreReceptor = empData[0].nomEmp;
                cargoReceptor  = empData[0].cargoOfi;
            }
        } else if (enc.idReceptores) {
            const [recData] = await connection.query(
                'SELECT nomRec, emprRec FROM receptores WHERE idReceptores = ?', [enc.idReceptores]
            );
            if (recData.length > 0) {
                nombreReceptor = recData[0].nomRec;
                cargoReceptor  = recData[0].emprRec;
            }
        }

        const [detalles] = await connection.query(
            'SELECT * FROM oficios_detalle WHERE idOfiEnc = ?', [id]
        );

        res.status(200).json({
            id:          parseInt(id),
            correlativo: enc.correla_OFIEnc,
            fecha:       enc.fech_OFIEnc,
            estado:      enc.est_OFIEnc,
            asunto:      enc.asunto_OFIEnc,
            emisor:   { nombre: emisor.nomUsu,  cargo: emisor.cargoUsu },
            receptor: { nombre: nombreReceptor, cargo: cargoReceptor   },
            items:    detalles,
        });
    } catch (error) {
        console.error('Error al obtener oficio por id:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};