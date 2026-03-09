const jwt = require("jsonwebtoken");

// Middleware para validar que el usuario tiene un token de acceso válido.
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  // Verifica la autenticidad del token usando la clave secreta del servidor.
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = {
    idUsuarios: decoded.idUsuarios,
    nomUsu: decoded.nomUsu,
    cargoUsu: decoded.cargoUsu,
    corUsu: decoded.corUsu
   
};

    next();
  } catch (error) {
    const mensajeError = error.name === "TokenExpiredError" ? "Token expirado" : "Token inválido";
    return res.status(401).json({ error: mensajeError });
  }
}

module.exports = auth ;

