const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

function getDBPath() {
  if (app && app.isPackaged) {
    // En producción: carpeta de datos del usuario
    const { app } = require("electron");
    const userDataPath = app.getPath("userData");
    return path.join(userDataPath, "database.db");
  }
  // En desarrollo: raíz del proyecto
  return path.join(__dirname, "..", "..", "database.db");
}

// Fix: importar app de electron solo si está disponible
let dbPath;
try {
  const { app } = require("electron");
  if (app.isPackaged) {
    const userDataPath = app.getPath("userData");
    dbPath = path.join(userDataPath, "database.db");
  } else {
    dbPath = path.join(__dirname, "..", "..", "database.db");
  }
} catch {
  // No estamos en Electron, modo desarrollo Node puro
  dbPath = path.join(__dirname, "..", "..", "database.db");
}

const DB_PATH = dbPath;

let db;

function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("foreign_keys = ON");
    console.log("Conexion a base de datos establecida en:", DB_PATH);
  }
  return db;
}

module.exports = { getDatabase, DB_PATH };
