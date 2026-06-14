const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const service = require("./tasa.service");

router.use(auth);

// GET /api/tasa/vigente
router.get("/vigente", (req, res) => {
  try {
    const datos = service.tasaVigente();
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// GET /api/tasa/historial
router.get("/historial", (req, res) => {
  try {
    const datos = service.historial();
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// POST /api/tasa/bcv — obtener y guardar desde BCV automáticamente
router.post("/bcv", async (req, res) => {
  try {
    const datos = await service.sincronizarDesdeBCV(req.usuario.username);
    res.status(201).json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// POST /api/tasa/manual — registrar manualmente
router.post("/manual", (req, res) => {
  try {
    const datos = service.registrarManual(req.body, req.usuario.username);
    res.status(201).json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

module.exports = router;
