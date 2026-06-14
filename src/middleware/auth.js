const { verificarToken } = require("../config/auth");

function authMiddleware(req, res, next) {
  // Buscar el token en los headers de la petición
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      ok: false,
      mensaje: "Acceso denegado. Token no proporcionado",
    });
  }

  try {
    const decoded = verificarToken(token);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      mensaje: "Token inválido o expirado",
    });
  }
}

module.exports = authMiddleware;
