const { getDatabase } = require("../../config/database");

function obtenerMaestria(id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM maestrias WHERE id = ?
    `,
    )
    .get(id);
}

function obtenerAlumnoPorCI(cedula) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM alumnos WHERE cedula = ?
    `,
    )
    .get(cedula);
}

function obtenerFilasPorMaestria(maestria_id, periodo_id) {
  const db = getDatabase();

  let query = `
        SELECT
            a.cedula, a.nombres, a.apellidos,
            a.telefono, a.email,
            m.nombre  AS maestria,
            p.codigo  AS periodo,
            p.costo_usd,
            i.total_pagado, i.estado,
            c.numero  AS cuota_numero,
            c.fecha_pago, c.monto_usd,
            c.monto_bs, c.referencia,
            c.estado  AS cuota_estado,
            t.tasa_bs
        FROM alumnos a
        JOIN maestrias     m ON a.maestria_id    = m.id
        JOIN inscripciones i ON i.alumno_id      = a.id
        JOIN periodos      p ON i.periodo_id     = p.id
        LEFT JOIN cuotas   c ON c.inscripcion_id = i.id
                             AND c.estado != 'ANULADO'
        LEFT JOIN tasas_cambio t ON c.tasa_id    = t.id
        WHERE a.maestria_id = ?
    `;
  const params = [maestria_id];

  if (periodo_id) {
    query += " AND p.id = ?";
    params.push(periodo_id);
  }

  query += " ORDER BY a.apellidos ASC, a.nombres ASC, c.numero ASC";
  return db.prepare(query).all(...params);
}

function obtenerFilasPorEstudiante(cedula) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
            a.cedula, a.nombres, a.apellidos,
            a.telefono, a.email,
            m.nombre  AS maestria,
            p.codigo  AS periodo,
            p.costo_usd,
            i.total_pagado, i.estado,
            c.numero  AS cuota_numero,
            c.fecha_pago, c.monto_usd,
            c.monto_bs, c.referencia,
            c.estado  AS cuota_estado,
            t.tasa_bs
        FROM alumnos a
        JOIN maestrias     m ON a.maestria_id    = m.id
        JOIN inscripciones i ON i.alumno_id      = a.id
        JOIN periodos      p ON i.periodo_id     = p.id
        LEFT JOIN cuotas   c ON c.inscripcion_id = i.id
                             AND c.estado != 'ANULADO'
        LEFT JOIN tasas_cambio t ON c.tasa_id    = t.id
        WHERE a.cedula = ?
        ORDER BY p.codigo ASC, c.numero ASC
    `,
    )
    .all(cedula);
}

function obtenerResumenPorPeriodo(periodo_id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
            m.nombre AS maestria,
            COUNT(DISTINCT a.id)          AS estudiantes,
            COALESCE(SUM(CASE WHEN c.estado != 'ANULADO'
                THEN c.monto_usd ELSE 0 END), 0) AS recaudado,
            COALESCE(p.costo_usd * COUNT(DISTINCT a.id) -
                SUM(CASE WHEN c.estado != 'ANULADO'
                THEN c.monto_usd ELSE 0 END), 0)  AS pendiente
        FROM maestrias m
        JOIN periodos      p ON p.maestria_id  = m.id
        JOIN inscripciones i ON i.periodo_id   = p.id
        JOIN alumnos       a ON i.alumno_id    = a.id
        LEFT JOIN cuotas   c ON c.inscripcion_id = i.id
        WHERE p.id = ?
        GROUP BY m.id, m.nombre, p.costo_usd
        ORDER BY m.nombre ASC
    `,
    )
    .all(periodo_id);
}

module.exports = {
  obtenerMaestria,
  obtenerAlumnoPorCI,
  obtenerFilasPorMaestria,
  obtenerFilasPorEstudiante,
  obtenerResumenPorPeriodo,
};
