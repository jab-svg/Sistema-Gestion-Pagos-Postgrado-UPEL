const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const service = require("./maestrias.service");

router.use(auth);

// ── Maestrías ─────────────────────────────────────────────

router.get("/", (req, res) => {
  try {
    const datos = service.listarMaestrias();
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

router.get("/:id", (req, res) => {
  try {
    const datos = service.obtenerMaestria(req.params.id);
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

router.post("/", (req, res) => {
  try {
    const datos = service.crearMaestria(req.body);
    res.status(201).json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

router.put("/:id", (req, res) => {
  try {
    const datos = service.actualizarMaestria(req.params.id, req.body);
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const resultado = service.eliminarMaestria(req.params.id);
    res.json({ ok: true, ...resultado });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// ── Períodos ──────────────────────────────────────────────

router.get("/:id/periodos", (req, res) => {
  try {
    const datos = service.listarPeriodos(req.params.id);
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

router.post("/:id/periodos", (req, res) => {
  try {
    const datos = service.crearPeriodo(req.params.id, req.body);
    res.status(201).json({ ok: true, datos });
  } catch (error) {
    console.error("Error al crear período:", error);
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || error.message || "Error interno",
    });
  }
});

router.put("/:maestriaId/periodos/:id", (req, res) => {
  try {
    const datos = service.actualizarPeriodo(req.params.id, req.body);
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

router.patch("/:maestriaId/periodos/:id/estado", (req, res) => {
  try {
    const resultado = service.togglePeriodo(req.params.id);
    res.json({ ok: true, ...resultado });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

module.exports = router;
