const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const service = require("./reportes.service");

router.use(auth);

// GET /api/reportes/maestria/:id?periodo_id=1
router.get("/maestria/:id", async (req, res) => {
  try {
    const buffer = await service.generarReportePorMaestria(
      req.params.id,
      req.query.periodo_id,
    );
    const fecha = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte_maestria_${fecha}.pdf"`,
    );
    res.send(buffer);
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// GET /api/reportes/estudiante/:cedula
router.get("/estudiante/:cedula", async (req, res) => {
  try {
    const buffer = await service.generarReportePorEstudiante(req.params.cedula);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte_${req.params.cedula}.pdf"`,
    );
    res.send(buffer);
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// GET /api/reportes/resumen/:periodo_id
router.get("/resumen/:periodo_id", async (req, res) => {
  try {
    const buffer = await service.generarResumenPeriodo(req.params.periodo_id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="resumen_periodo.pdf"`,
    );
    res.send(buffer);
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

module.exports = router;
