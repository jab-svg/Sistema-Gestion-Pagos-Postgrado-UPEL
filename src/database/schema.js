const { getDatabase } = require("../config/database");

function inicializarBaseDeDatos() {
  const db = getDatabase();

  db.exec(`
        -- Usuarios del sistema (administradores)
        CREATE TABLE IF NOT EXISTS usuarios (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre      TEXT    NOT NULL,
            username    TEXT    NOT NULL UNIQUE,
            password    TEXT    NOT NULL,
            rol         TEXT    NOT NULL DEFAULT 'admin',
            activo      INTEGER NOT NULL DEFAULT 1,
            created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- Maestrias
        CREATE TABLE IF NOT EXISTS maestrias (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre  TEXT    NOT NULL UNIQUE,
            activa  INTEGER NOT NULL DEFAULT 1
        );

        -- Periodos academicos
        CREATE TABLE IF NOT EXISTS periodos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo      TEXT    NOT NULL,
            maestria_id INTEGER NOT NULL,
            costo_usd   REAL    NOT NULL CHECK(costo_usd > 0),
            activo      INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (maestria_id) REFERENCES maestrias(id),
            UNIQUE(codigo, maestria_id)              
);

        -- Alumnos
        CREATE TABLE IF NOT EXISTS alumnos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            cedula      TEXT    NOT NULL UNIQUE,
            nombres     TEXT    NOT NULL,
            apellidos   TEXT    NOT NULL,
            telefono    TEXT,
            email       TEXT,
            maestria_id INTEGER NOT NULL,
            FOREIGN KEY (maestria_id) REFERENCES maestrias(id)
        );

        -- Inscripciones de alumnos en periodos
        CREATE TABLE IF NOT EXISTS inscripciones (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            alumno_id       INTEGER NOT NULL,
            periodo_id      INTEGER NOT NULL,
            costo_aplicado  REAL    NOT NULL,
            total_pagado    REAL    NOT NULL DEFAULT 0,
            estado          TEXT    NOT NULL DEFAULT 'PENDIENTE',
            fecha           TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (alumno_id)  REFERENCES alumnos(id),
            FOREIGN KEY (periodo_id) REFERENCES periodos(id),
            UNIQUE(alumno_id, periodo_id)
        );

        -- Cuotas de pago
        CREATE TABLE IF NOT EXISTS cuotas (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            inscripcion_id  INTEGER NOT NULL,
            numero          INTEGER NOT NULL CHECK(numero BETWEEN 1 AND 3),
            fecha_pago      TEXT    NOT NULL,
            monto_usd       REAL    NOT NULL CHECK(monto_usd > 0),
            monto_bs        REAL    NOT NULL CHECK(monto_bs > 0),
            tasa_id         INTEGER NOT NULL,
            referencia      TEXT    NOT NULL UNIQUE,
            estado          TEXT    NOT NULL DEFAULT 'PAGADO',
            FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id),
            FOREIGN KEY (tasa_id)        REFERENCES tasas_cambio(id)
        );

        -- Tasas de cambio BCV
        CREATE TABLE IF NOT EXISTS tasas_cambio (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            tasa_bs  REAL NOT NULL CHECK(tasa_bs > 0),
            fecha    TEXT NOT NULL DEFAULT (datetime('now')),
            fuente   TEXT NOT NULL DEFAULT 'BCV',
            usuario  TEXT NOT NULL
        );

        -- Auditoria de pagos
        CREATE TABLE IF NOT EXISTS auditoria_pagos (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            cuota_id       INTEGER NOT NULL,
            inscripcion_id INTEGER NOT NULL,
            accion         TEXT    NOT NULL,
            motivo         TEXT    NOT NULL,
            usuario        TEXT    NOT NULL,
            fecha          TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (cuota_id)       REFERENCES cuotas(id),
            FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id)
        );
    `);

  // Crear usuario administrador por defecto si no existe ninguno
  const bcrypt = require("bcryptjs");
  const totalUsuarios = db
    .prepare("SELECT COUNT(*) as total FROM usuarios")
    .get();

  if (totalUsuarios.total === 0) {
    const passwordHash = bcrypt.hashSync("admin123", 10);
    db.prepare(
      `
            INSERT INTO usuarios (nombre, username, password, rol)
            VALUES (?, ?, ?, ?)
        `,
    ).run("Administrador", "admin", passwordHash, "superadmin");
    console.log("Usuario administrador creado — user: admin / pass: admin123");
  }

  console.log("Base de datos inicializada correctamente");
}

module.exports = { inicializarBaseDeDatos };
