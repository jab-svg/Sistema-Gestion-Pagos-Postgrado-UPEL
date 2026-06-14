const { getDatabase } = require("../../config/database");

function obtenerTodos() {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT id, nombre, username, rol, activo, created_at
        FROM usuarios
        ORDER BY created_at DESC
    `,
    )
    .all();
}

function obtenerPorId(id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT id, nombre, username, rol, activo, created_at
        FROM usuarios
        WHERE id = ?
    `,
    )
    .get(id);
}

function obtenerPorUsername(username) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT id, nombre, username, rol, activo
        FROM usuarios
        WHERE username = ?
    `,
    )
    .get(username);
}

function crear(nombre, username, passwordHash, rol) {
  const db = getDatabase();
  const resultado = db
    .prepare(
      `
        INSERT INTO usuarios (nombre, username, password, rol)
        VALUES (?, ?, ?, ?)
    `,
    )
    .run(nombre, username, passwordHash, rol);
  return resultado.lastInsertRowid;
}

function actualizar(id, nombre, rol) {
  const db = getDatabase();
  db.prepare(
    `
        UPDATE usuarios
        SET nombre = ?, rol = ?
        WHERE id = ?
    `,
  ).run(nombre, rol, id);
}

function actualizarPassword(id, passwordHash) {
  const db = getDatabase();
  db.prepare(
    `
        UPDATE usuarios
        SET password = ?
        WHERE id = ?
    `,
  ).run(passwordHash, id);
}

function cambiarEstado(id, activo) {
  const db = getDatabase();
  db.prepare(
    `
        UPDATE usuarios
        SET activo = ?
        WHERE id = ?
    `,
  ).run(activo, id);
}

module.exports = {
  obtenerTodos,
  obtenerPorId,
  obtenerPorUsername,
  crear,
  actualizar,
  actualizarPassword,
  cambiarEstado,
};
