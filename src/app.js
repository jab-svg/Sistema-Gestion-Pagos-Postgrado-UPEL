const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ── Middlewares globales ───────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Archivos estáticos (frontend) ─────────────────────────
app.use(express.static(path.join(__dirname, "..", "public")));

// ── Rutas de la API ───────────────────────────────────────
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/usuarios", require("./modules/usuarios/usuarios.routes"));
app.use("/api/maestrias", require("./modules/maestrias/maestrias.routes"));
app.use(
  "/api/estudiantes",
  require("./modules/estudiantes/estudiantes.routes"),
);
app.use("/api/pagos", require("./modules/pagos/pagos.routes"));
app.use("/api/tasa", require("./modules/tasa/tasa.routes"));
app.use("/api/reportes", require("./modules/reportes/reportes.routes"));

//ruta backup
app.use("/api/backup", require("./modules/backup/backup.routes"));

// ── Ruta catch-all: cualquier otra URL devuelve el frontend
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ── Manejador global de errores ───────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    ok: false,
    mensaje: "Error interno del servidor",
  });
});

module.exports = app;
