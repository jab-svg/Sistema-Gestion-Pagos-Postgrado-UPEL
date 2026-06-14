const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const service = require("./usuarios.service");

// Todas las rutas de usuarios requieren autenticación
router.use(auth);

// GET /api/usuarios — listar todos
router.get("/", (req, res) => {
  try {
    const usuarios = service.listarUsuarios();
    res.json({ ok: true, datos: usuarios });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// GET /api/usuarios/:id — obtener uno
router.get("/:id", (req, res) => {
  try {
    const usuario = service.obtenerUsuario(req.params.id);
    res.json({ ok: true, datos: usuario });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// POST /api/usuarios — crear
router.post("/", (req, res) => {
  try {
    const nuevo = service.crearUsuario(req.body, req.usuario);
    res.status(201).json({ ok: true, datos: nuevo });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// PUT /api/usuarios/:id — actualizar
router.put("/:id", (req, res) => {
  try {
    const actualizado = service.actualizarUsuario(
      req.params.id,
      req.body,
      req.usuario,
    );
    res.json({ ok: true, datos: actualizado });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// PUT /api/usuarios/:id/password — cambiar contraseña
router.put("/:id/password", (req, res) => {
  try {
    const resultado = service.cambiarPassword(
      req.params.id,
      req.body,
      req.usuario,
    );
    res.json({ ok: true, ...resultado });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// PATCH /api/usuarios/:id/estado — activar/desactivar
router.patch("/:id/estado", (req, res) => {
  try {
    const resultado = service.toggleEstado(req.params.id, req.usuario);
    res.json({ ok: true, ...resultado });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

module.exports = router;
