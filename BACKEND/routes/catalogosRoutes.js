const express = require('express');
const router = express.Router();
const catalogosController = require('../controllers/catalogosController');

// Rutas para empleados
router.get('/empleados', catalogosController.getEmpleados);

// Rutas para la oficina
router.get('/oficinas', catalogosController.getOficinas);
router.post('/oficinas', catalogosController.createOficina);

// Rutas para el equipo
router.get('/tiposEquipo', catalogosController.getTiposEquipo);
router.get('/marcas', catalogosController.getMarcas);
router.get('/modelos', catalogosController.getModelos);


module.exports = router;