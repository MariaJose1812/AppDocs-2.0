const express = require('express');
const router = express.Router();
const actasController = require('../controllers/actasController');

router.post ('/entrega', actasController.crearActaEntrega);







module.exports = router;