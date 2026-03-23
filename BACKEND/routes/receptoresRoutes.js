const express = require('express');
const router = express.Router();

const receptoresController = require('../controllers/receptoresController');

// Rutas para receptores
router.get('/receptores', receptoresController.obtenerReceptores);
router.post('/receptores', receptoresController.crearReceptor);

module.exports = router;