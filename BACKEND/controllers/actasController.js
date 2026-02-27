//recibir datos, buscar cargos actuales, guardar todo
const db = require('../config/db');

//Acta de Entrega (Borrador - Necesita cambios)

exports.crearActaEntrega = async (req, res) => {
    const { idUsuario, idReceptores, asunto, items} = req.body;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction(); 

       
        const [userData] = await connection.query('SELECT nomUsu, cargoUsu FROM usuarios WHERE idUsuarios = ?', [idUsuario]);
        const [recepData] = await connection.query('SELECT nomRec, empRec FROM receptores WHERE idReceptores = ?', [idReceptores]);

        // Validación 
        const usuario = userData.length > 0 
        ? {nombre: userData[0].nomUsu, cargo: userData[0].cargoUsu}
        : {nombre: 'Desconocido', cargo: 'S/C'};

        
        const receptor = recepData.length > 0
        ? {nombre:recepData[0].nomRec, cargo: recepData[0].empRec} 
        : {nombre: 'Desconocido', cargo: 'S/C'};

        //INSERTAR ENCABEZADO
        const queryEncabezado = 
            `INSERT INTO acta_entrega_encabezado
            (idReceptores, nombre_rec, idUsuario, nombre_usu, cargo_rec, cargo_usu, asunto_AEEnc, fech_AEEnc, est_AEEnc)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'Borrador')`
        ;

        const [resEncabezado] = await connection.query(queryEncabezado, [
            idReceptores,
            receptor.nombre,   
            idUsuario,
            usuario.nombre,
            usuario.cargo,    
            receptor.cargo,    
            asunto
        ]);

        const idNuevoEncabezado = resEncabezado.insertId; 

        // INSERTAR DETALLES
        if (items && items.length > 0) {
            
            const valoresDetalle = items.map(item => [
                idNuevoEncabezado,      
                item.descripcion,       
                item.marca || '',       
                item.modelo || '',      
                item.serie || 'S/N',    
                item.inventario || '',  
                item.asignado_a || '',  
                item.observacion || '',
                item.idFirmas || 1
            ]);

            const queryDetalle = `
                INSERT INTO acta_entrega_detalle 
                (idActa_EntregaEnc, descripcion_AEDet, marca_AEDet, modelo_AEDet, serie_AEDet, invFich_AEDet, asignado_a, observacion_AEDet, idFirmas_AEDet)
                VALUES ?
            `;

            await connection.query(queryDetalle, [valoresDetalle]);
        }

        //CONFIRMAR CAMBIOS 

        await connection.commit(); 
        connection.release();

        res.status(201).json({
            mensaje: "Acta creada exitosamente",
            id_acta: idNuevoEncabezado
        });

    } catch (error) {
        await connection.rollback(); 
        connection.release();
        console.error("Error al guardar acta:", error);
        res.status(500).json({ error: error.message });
    }
};


//Acta de Retiro
exports.crearActaRetiro = async (req, res)




