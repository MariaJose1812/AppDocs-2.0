const express = require('express');
const router = express.Router();

const empleadosController = require('../controllers/empleadosController');

// Rutas para empleados
router.get('/empleados', empleadosController.obtenerEmpleados);
router.post('/empleados', empleadosController.crearEmpleado);
router.put('/empleados/:id', empleadosController.actualizarEmpleado);

module.exports = router;