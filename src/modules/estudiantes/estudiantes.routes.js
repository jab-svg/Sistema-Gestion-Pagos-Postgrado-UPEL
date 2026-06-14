const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const service = require("./estudiantes.service");

router.use(auth);

// GET /api/estudiantes?maestria_id=1&estado=PENDIENTE&busqueda=garcia
router.get("/", (req, res) => {
  try {
    const datos = service.listarEstudiantes(req.query);
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// GET /api/estudiantes/ci/:cedula
router.get("/ci/:cedula", (req, res) => {
  try {
    const datos = service.buscarPorCI(req.params.cedula);
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// GET /api/estudiantes/:id
/*router.get("/:id", (req, res) => {
  try {
    const datos = service.buscarPorCI(req.params.id);
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});*/

router.get("/:id", (req, res) => {
  try {
    const alumno = require("./estudiantes.repository").obtenerPorId(
      req.params.id,
    );
    if (!alumno) throw { status: 404, mensaje: "Estudiante no encontrado" };
    res.json({ ok: true, datos: alumno });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// POST /api/estudiantes
router.post("/", (req, res) => {
  try {
    const datos = service.registrarEstudiante(req.body);
    res.status(201).json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

// PUT /api/estudiantes/:id
router.put("/:id", (req, res) => {
  try {
    const datos = service.actualizarEstudiante(req.params.id, req.body);
    res.json({ ok: true, datos });
  } catch (error) {
    res.status(error.status || 500).json({
      ok: false,
      mensaje: error.mensaje || "Error interno",
    });
  }
});

module.exports = router;
