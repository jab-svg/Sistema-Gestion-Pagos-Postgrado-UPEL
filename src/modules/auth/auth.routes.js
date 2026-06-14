const express = require("express");
const router = express.Router();
const { login } = require("./auth.service");

// POST /api/auth/login
router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;
    const resultado = login(username, password);
    res.json({ ok: true, ...resultado });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  // Con JWT el logout es del lado del cliente
  // simplemente se elimina el token del navegador
  res.json({ ok: true, mensaje: "Sesión cerrada correctamente" });
});

module.exports = router;
