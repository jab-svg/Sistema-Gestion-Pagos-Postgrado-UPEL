const { getDatabase } = require("../../config/database");

// ── Maestrías ─────────────────────────────────────────────

function obtenerTodas() {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM maestrias
        ORDER BY nombre ASC
    `,
    )
    .all();
}

function obtenerPorId(id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM maestrias WHERE id = ?
    `,
    )
    .get(id);
}

function obtenerPorNombre(nombre) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM maestrias WHERE nombre = ?
    `,
    )
    .get(nombre);
}

function crear(nombre) {
  const db = getDatabase();
  const resultado = db
    .prepare(
      `
        INSERT INTO maestrias (nombre) VALUES (?)
    `,
    )
    .run(nombre);
  return resultado.lastInsertRowid;
}

function actualizar(id, nombre) {
  const db = getDatabase();
  db.prepare(
    `
        UPDATE maestrias SET nombre = ? WHERE id = ?
    `,
  ).run(nombre, id);
}

function cambiarEstado(id, activa) {
  const db = getDatabase();
  db.prepare(
    `
        UPDATE maestrias SET activa = ? WHERE id = ?
    `,
  ).run(activa, id);
}

function tieneEstudiantes(id) {
  const db = getDatabase();
  const resultado = db
    .prepare(
      `
        SELECT COUNT(*) as total FROM alumnos
        WHERE maestria_id = ?
    `,
    )
    .get(id);
  return resultado.total > 0;
}

// ── Períodos ──────────────────────────────────────────────

function obtenerPeriodos(maestria_id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM periodos
        WHERE maestria_id = ?
        ORDER BY codigo DESC
    `,
    )
    .all(maestria_id);
}

function obtenerPeriodoPorId(id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM periodos WHERE id = ?
    `,
    )
    .get(id);
}

function obtenerPeriodoPorCodigo(codigo, maestria_id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM periodos
        WHERE codigo = ? AND maestria_id = ?
    `,
    )
    .get(codigo, maestria_id);
}

function crearPeriodo(maestria_id, codigo, costo_usd) {
  const db = getDatabase();
  const resultado = db
    .prepare(
      `
        INSERT INTO periodos (maestria_id, codigo, costo_usd)
        VALUES (?, ?, ?)
    `,
    )
    .run(maestria_id, codigo, costo_usd);
  return resultado.lastInsertRowid;
}

function actualizarPeriodo(id, codigo, costo_usd) {
  const db = getDatabase();
  db.prepare(
    `
        UPDATE periodos SET codigo = ?, costo_usd = ?
        WHERE id = ?
    `,
  ).run(codigo, costo_usd, id);
}

function periodoTieneInscripciones(id) {
  const db = getDatabase();
  const resultado = db
    .prepare(
      `
        SELECT COUNT(*) as total FROM inscripciones
        WHERE periodo_id = ?
    `,
    )
    .get(id);
  return resultado.total > 0;
}

function cambiarEstadoPeriodo(id, activo) {
  const db = getDatabase();
  db.prepare(
    `
        UPDATE periodos SET activo = ? WHERE id = ?
    `,
  ).run(activo, id);
}

module.exports = {
  obtenerTodas,
  obtenerPorId,
  obtenerPorNombre,
  crear,
  actualizar,
  cambiarEstado,
  tieneEstudiantes,
  obtenerPeriodos,
  obtenerPeriodoPorId,
  obtenerPeriodoPorCodigo,
  crearPeriodo,
  actualizarPeriodo,
  periodoTieneInscripciones,
  cambiarEstadoPeriodo,
};
