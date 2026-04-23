const express = require('express');
const router = express.Router();

const receptoresController = require('../controllers/receptoresController');

// Rutas para receptores
router.get('/receptores', receptoresController.obtenerReceptores);
router.post('/receptores', receptoresController.crearReceptor);
router.put('/receptores/:id', receptoresController.actualizarReceptor);
router.put('/receptores/:id/estado', receptoresController.cambiarEstadoReceptor);


module.exports = router;