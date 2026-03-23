const express = require("express");
const router = express.Router();
const plantillasController = require("../controllers/plantillasController");

router.get("/plantillas/:tipoActa",        plantillasController.obtenerPlantillas);
router.get("/plantillas/:tipoActa/activa", plantillasController.obtenerPlantillaActiva);
router.post("/plantillas",                 plantillasController.crearPlantilla);
router.put("/plantillas/:id",              plantillasController.actualizarPlantilla);
router.put("/plantillas/:id/activar",      plantillasController.activarPlantilla);
router.delete("/plantillas/:id",           plantillasController.eliminarPlantilla);

module.exports = router;