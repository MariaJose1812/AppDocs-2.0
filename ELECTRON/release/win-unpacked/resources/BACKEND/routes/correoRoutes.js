const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { enviarCorreo } = require("../controllers/correoController");

router.post("/correo/enviar", authMiddleware, enviarCorreo);

module.exports = router;