const express = require("express");
const router = express.Router();
const equiposController = require("../controllers/equiposController");
 
router.get("/equipos", equiposController.getEquipos);
 
module.exports = router;
 