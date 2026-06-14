const { getDatabase } = require("../../config/database");

function obtenerTodos(filtros = {}) {
  const db = getDatabase();
  let query = `
        SELECT
            a.id, a.cedula, a.nombres, a.apellidos,
            a.telefono, a.email,a.maestria_id,
            m.nombre  AS maestria,
            p.codigo  AS periodo,
            p.costo_usd,
            i.id      AS inscripcion_id,
            i.total_pagado,
            i.estado
        FROM alumnos a
        JOIN maestrias    m ON a.maestria_id = m.id
        JOIN inscripciones i ON i.alumno_id  = a.id
        JOIN periodos     p ON i.periodo_id  = p.id
        WHERE 1=1
    `;
  const params = [];

  if (filtros.maestria_id) {
    query += " AND a.maestria_id = ?";
    params.push(filtros.maestria_id);
  }
  if (filtros.estado) {
    query += " AND i.estado = ?";
    params.push(filtros.estado);
  }
  if (filtros.busqueda) {
    query += ` AND (
            a.cedula    LIKE ? OR
            a.nombres   LIKE ? OR
            a.apellidos LIKE ?
        )`;
    const like = `%${filtros.busqueda}%`;
    params.push(like, like, like);
  }

  query += " ORDER BY a.apellidos ASC, a.nombres ASC";
  return db.prepare(query).all(...params);
}

function obtenerPorCI(cedula) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
            a.id, a.cedula, a.nombres, a.apellidos,
            a.telefono, a.email, a.maestria_id,
            m.nombre AS maestria
        FROM alumnos a
        JOIN maestrias m ON a.maestria_id = m.id
        WHERE a.cedula = ?
    `,
    )
    .get(cedula);
}

function obtenerPorId(id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
            a.id, a.cedula, a.nombres, a.apellidos,
            a.telefono, a.email, a.maestria_id,
            m.nombre AS maestria
        FROM alumnos a
        JOIN maestrias m ON a.maestria_id = m.id
        WHERE a.id = ?
    `,
    )
    .get(id);
}

function obtenerInscripciones(alumno_id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
            i.id, i.total_pagado, i.estado, i.fecha,
            i.costo_aplicado,
            p.codigo  AS periodo,
            p.costo_usd,
            m.nombre  AS maestria
        FROM inscripciones i
        JOIN periodos  p ON i.periodo_id  = p.id
        JOIN maestrias m ON p.maestria_id = m.id
        WHERE i.alumno_id = ?
        ORDER BY i.fecha DESC
    `,
    )
    .all(alumno_id);
}

function crear(cedula, nombres, apellidos, telefono, email, maestria_id) {
  const db = getDatabase();
  const resultado = db
    .prepare(
      `
        INSERT INTO alumnos
            (cedula, nombres, apellidos, telefono, email, maestria_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `,
    )
    .run(cedula, nombres, apellidos, telefono, email, maestria_id);
  return resultado.lastInsertRowid;
}

function inscribir(alumno_id, periodo_id, costo_aplicado) {
  const db = getDatabase();
  const resultado = db
    .prepare(
      `
        INSERT INTO inscripciones
            (alumno_id, periodo_id, costo_aplicado, total_pagado, estado)
        VALUES (?, ?, ?, 0, 'PENDIENTE')
    `,
    )
    .run(alumno_id, periodo_id, costo_aplicado);
  return resultado.lastInsertRowid;
}

function actualizar(id, nombres, apellidos, telefono, email) {
  const db = getDatabase();
  db.prepare(
    `
        UPDATE alumnos
        SET nombres = ?, apellidos = ?, telefono = ?, email = ?
        WHERE id = ?
    `,
  ).run(nombres, apellidos, telefono, email, id);
}

module.exports = {
  obtenerTodos,
  obtenerPorCI,
  obtenerPorId,
  obtenerInscripciones,
  crear,
  inscribir,
  actualizar,
};
