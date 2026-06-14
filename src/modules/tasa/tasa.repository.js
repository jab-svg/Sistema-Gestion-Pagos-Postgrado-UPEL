const { getDatabase } = require("../../config/database");

function obtenerTasaVigente() {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM tasas_cambio
        ORDER BY fecha DESC
        LIMIT 1
    `,
    )
    .get();
}

function obtenerHistorial() {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM tasas_cambio
        ORDER BY fecha DESC
        LIMIT 30
    `,
    )
    .all();
}

function registrar(tasa_bs, fuente, usuario) {
  const db = getDatabase();
  const resultado = db
    .prepare(
      `
        INSERT INTO tasas_cambio (tasa_bs, fuente, usuario)
        VALUES (?, ?, ?)
    `,
    )
    .run(tasa_bs, fuente, usuario);
  return resultado.lastInsertRowid;
}

function obtenerPorId(id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM tasas_cambio WHERE id = ?
    `,
    )
    .get(id);
}

module.exports = {
  obtenerTasaVigente,
  obtenerHistorial,
  registrar,
  obtenerPorId,
};
