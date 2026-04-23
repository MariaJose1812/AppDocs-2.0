const express = require("express");
const router = express.Router();

const actasController = require("../controllers/actasController");
const recepcionController = require("../controllers/recepcionController");
const paseSalidaController = require("../controllers/paseSalidaController");
const memorandumController = require("../controllers/memorandumController");
const oficiosController = require("../controllers/oficiosController");
const reportesController = require("../controllers/reportesController");
const catalogosController = require("../controllers/catalogosController");
const upload = require("../middlewares/upload");

const dashboardController = require("../controllers/dashboardController");

//Acta de Entrega y Retiro
router.post(
  "/procesadas",
  upload.array("imagenes", 10),
  actasController.procesarActa,
);

router.get("/procesadas/:tipo/:id", actasController.obtenerActaPorId);

//Acta de Recepción
router.post("/recepcion", recepcionController.recepcionActa);

router.get("/detalle/RECEPCION/:id", recepcionController.obtenerRecepcionPorId);

//Pase de Salida
router.post("/pase-salida", paseSalidaController.paseSalida);
router.get("/pase-salida", paseSalidaController.obtenerPaseSalida);
router.get("/pase-salida/:id", paseSalidaController.obtenerPasePorId);

//Memorandum
router.post("/memorandum", memorandumController.crearMemorandum);

router.get("/memorandum/:id", memorandumController.obtenerMemorandumPorId);

//Oficios
router.post("/oficios", oficiosController.crearOficio);
router.get("/oficios", oficiosController.obtenerOficios);
router.get("/oficios/:id", oficiosController.obtenerOficioPorId);

//Reporte
router.post(
  "/reporte",
  upload.array("imagenes", 10), 
  reportesController.crearReporte,
);
router.get("/detalle/REPORTE/:id", reportesController.obtenerReportePorId);

//Historial
router.get("/historial", dashboardController.obtenerHistorial);
router.get("/detalle/:tipo/:id", dashboardController.obtenerDetalle);

module.exports = router;
