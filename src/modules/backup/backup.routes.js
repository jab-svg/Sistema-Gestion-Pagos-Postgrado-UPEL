const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

router.use(auth);

//const DB_PATH = path.join(__dirname, "..", "..", "..", "database.db");

const { DB_PATH } = require("../../config/database");

// Multer — guardar el archivo subido temporalmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "..", "temp"));
  },
  filename: (req, file, cb) => {
    cb(null, `restore_${Date.now()}.db`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith(".db")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos .db"));
    }
  },
});

// GET /api/backup/exportar — descargar la BD
router.get("/exportar", (req, res) => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return res.status(404).json({
        ok: false,
        mensaje: "Base de datos no encontrada",
      });
    }

    const fecha = new Date().toISOString().split("T")[0];
    const filename = `sgpp_backup_${fecha}.db`;

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(DB_PATH);
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, mensaje: "Error al exportar la base de datos" });
  }
});

// POST /api/backup/importar — restaurar la BD
router.post("/importar", upload.single("database"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se recibió ningún archivo",
      });
    }

    const tempPath = req.file.path;

    // Verificar que el archivo es una BD SQLite válida
    const header = Buffer.alloc(16);
    const fd = fs.openSync(tempPath, "r");
    fs.readSync(fd, header, 0, 16, 0);
    fs.closeSync(fd);

    const sqliteHeader = "SQLite format 3\0";
    if (header.toString() !== sqliteHeader) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({
        ok: false,
        mensaje: "El archivo no es una base de datos SQLite válida",
      });
    }

    // Hacer backup de la BD actual antes de reemplazar
    const backupPath = DB_PATH.replace(".db", `_prev_${Date.now()}.db`);
    fs.copyFileSync(DB_PATH, backupPath);

    // Reemplazar la BD actual con la importada
    fs.copyFileSync(tempPath, DB_PATH);
    fs.unlinkSync(tempPath);

    // Eliminar backup previo si tiene más de 3 días
    // (limpieza automática para no acumular archivos)
    const dir = path.dirname(DB_PATH);
    fs.readdirSync(dir)
      .filter((f) => f.includes("_prev_") && f.endsWith(".db"))
      .forEach((f) => {
        const stats = fs.statSync(path.join(dir, f));
        const dias = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        if (dias > 3) fs.unlinkSync(path.join(dir, f));
      });

    res.json({
      ok: true,
      mensaje:
        "Base de datos restaurada correctamente. Reinicia el servidor para aplicar los cambios.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, mensaje: "Error al importar la base de datos" });
  }
});

module.exports = router;
