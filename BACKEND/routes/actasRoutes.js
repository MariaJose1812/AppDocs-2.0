const express = require('express');
const router = express.Router();

const actasController = require('../controllers/actasController');
const recepcionController = require('../controllers/recepcionController');
const paseSalidaController = require('../controllers/paseSalidaController');
const memorandumController = require('../controllers/memorandumController');
const oficiosController = require('../controllers/oficiosController');
const reportesController = require('../controllers/reportesController');
const catalogosController = require('../controllers/catalogosController');

const dashboardController = require('../controllers/dashboardController');

//Acta de Entrega y Retiro
router.post ('/procesadas', actasController.procesarActa);

router.get('/procesadas/:tipo/:id', actasController.obtenerActaPorId);

//Acta de Recepción
router.post('/recepcion', recepcionController.recepcionActa);

router.get('/recepcion/todos', recepcionController.obtenerActasRecepcion);

//Pase de Salida
router.post('/pase-salida', paseSalidaController.paseSalida);

router.get('/pase-salida/todos', paseSalidaController.obtenerPaseSalida);

//Memorandum
router.post('/memorandum', memorandumController.crearMemorandum);

router.get('/memorandum/todos', memorandumController.obtenerMemorandums);

//Oficios
router.post('/oficios', oficiosController.crearOficio);

router.get('/oficios/todos', oficiosController.obtenerOficios);

//Reporte
router.post('/reporte', reportesController.generarReporte);

router.get('/reportes/todos', reportesController.obtenerReportes);

//Historial
router.get('/historial', dashboardController.obtenerHistorial);
router.get('/detalle/:tipo/:id', dashboardController.obtenerDetalle);



module.exports = router;