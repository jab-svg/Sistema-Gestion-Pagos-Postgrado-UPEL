const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const service = require("./pagos.service");

router.use(auth);

// GET /api/pagos/inscripcion/:id — ver cuotas de una inscripción
router.get("/inscripcion/:id", (req, res) => {
  try {
    const datos = service.obtenerPagosPorInscripcion(req.params.id);
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// POST /api/pagos — registrar cuota
router.post("/", (req, res) => {
  try {
    const datos = service.registrarPago(req.body, req.usuario.username);
    res.status(201).json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// PUT /api/pagos/:id — editar cuota
router.put("/:id", (req, res) => {
  try {
    const datos = service.editarPago(
      req.params.id,
      req.body,
      req.usuario.username,
    );
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// PATCH /api/pagos/:id/anular — anular cuota
router.patch("/:id/anular", (req, res) => {
  try {
    const resultado = service.anularPago(
      req.params.id,
      req.body,
      req.usuario.username,
    );
    res.json({ ok: true, ...resultado });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

module.exports = router;
