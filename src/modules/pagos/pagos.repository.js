const { getDatabase } = require("../../config/database");

function obtenerCuotasPorInscripcion(inscripcion_id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
            c.id, c.numero, c.fecha_pago,
            c.monto_usd, c.monto_bs, c.referencia,
            c.estado, c.tasa_id,
            t.tasa_bs, t.fecha AS fecha_tasa
        FROM cuotas c
        JOIN tasas_cambio t ON c.tasa_id = t.id
        WHERE c.inscripcion_id = ?
        ORDER BY c.numero ASC
    `,
    )
    .all(inscripcion_id);
}

function obtenerCuotaPorId(id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
            c.*,
            t.tasa_bs,
            i.alumno_id, i.periodo_id,
            i.costo_aplicado, i.total_pagado
        FROM cuotas c
        JOIN tasas_cambio  t ON c.tasa_id        = t.id
        JOIN inscripciones i ON c.inscripcion_id = i.id
        WHERE c.id = ?
    `,
    )
    .get(id);
}

function obtenerCuotaPorReferencia(referencia) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM cuotas WHERE referencia = ?
    `,
    )
    .get(referencia);
}

function obtenerInscripcion(alumno_id, periodo_id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM inscripciones
        WHERE alumno_id = ? AND periodo_id = ?
    `,
    )
    .get(alumno_id, periodo_id);
}

function obtenerInscripcionPorId(id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM inscripciones WHERE id = ?
    `,
    )
    .get(id);
}

function contarCuotasActivas(inscripcion_id) {
  const db = getDatabase();
  const resultado = db
    .prepare(
      `
        SELECT COUNT(*) as total FROM cuotas
        WHERE inscripcion_id = ? AND estado != 'ANULADO'
    `,
    )
    .get(inscripcion_id);
  return resultado.total;
}

function registrarCuota(
  inscripcion_id,
  numero,
  fecha_pago,
  monto_usd,
  monto_bs,
  referencia,
  tasa_id,
) {
  const db = getDatabase();
  const resultado = db
    .prepare(
      `
        INSERT INTO cuotas
            (inscripcion_id, numero, fecha_pago,
             monto_usd, monto_bs, referencia, tasa_id, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PAGADO')
    `,
    )
    .run(
      inscripcion_id,
      numero,
      fecha_pago,
      monto_usd,
      monto_bs,
      referencia,
      tasa_id,
    );
  return resultado.lastInsertRowid;
}

function actualizarTotalPagado(inscripcion_id) {
  const db = getDatabase();

  // Recalcula sumando solo cuotas no anuladas
  const resultado = db
    .prepare(
      `
        SELECT COALESCE(SUM(monto_usd), 0) AS total
        FROM cuotas
        WHERE inscripcion_id = ? AND estado != 'ANULADO'
    `,
    )
    .get(inscripcion_id);

  const total = resultado.total;

  // Obtener costo del período para determinar estado
  const inscripcion = db
    .prepare(
      `
        SELECT costo_aplicado FROM inscripciones WHERE id = ?
    `,
    )
    .get(inscripcion_id);

  let estado;
  if (total <= 0) {
    estado = "PENDIENTE";
  } else if (total >= inscripcion.costo_aplicado) {
    estado = "SOLVENTE";
  } else {
    estado = "PAGADO_PARCIAL";
  }

  db.prepare(
    `
        UPDATE inscripciones
        SET total_pagado = ?, estado = ?
        WHERE id = ?
    `,
  ).run(total, estado, inscripcion_id);

  return { total, estado };
}

function anularCuota(id, motivo, usuario) {
  const db = getDatabase();
  db.prepare(
    `
        UPDATE cuotas SET estado = 'ANULADO' WHERE id = ?
    `,
  ).run(id);

  // Registrar en auditoría
  const cuota = db
    .prepare(
      `
        SELECT inscripcion_id FROM cuotas WHERE id = ?
    `,
    )
    .get(id);

  db.prepare(
    `
        INSERT INTO auditoria_pagos
            (cuota_id, inscripcion_id, accion, motivo, usuario)
        VALUES (?, ?, 'ANULACION', ?, ?)
    `,
  ).run(id, cuota.inscripcion_id, motivo, usuario);
}

function editarCuota(id, datos, motivo, usuario) {
  const db = getDatabase();
  const { fecha_pago, monto_usd, monto_bs, referencia } = datos;

  db.prepare(
    `
        UPDATE cuotas
        SET fecha_pago = ?, monto_usd = ?,
            monto_bs = ?, referencia = ?
        WHERE id = ?
    `,
  ).run(fecha_pago, monto_usd, monto_bs, referencia, id);

  // Registrar en auditoría
  const cuota = db
    .prepare(
      `
        SELECT inscripcion_id FROM cuotas WHERE id = ?
    `,
    )
    .get(id);

  db.prepare(
    `
        INSERT INTO auditoria_pagos
            (cuota_id, inscripcion_id, accion, motivo, usuario)
        VALUES (?, ?, 'EDICION', ?, ?)
    `,
  ).run(id, cuota.inscripcion_id, motivo, usuario);
}

function obtenerAuditoria(inscripcion_id) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM auditoria_pagos
        WHERE inscripcion_id = ?
        ORDER BY fecha DESC
    `,
    )
    .all(inscripcion_id);
}

module.exports = {
  obtenerCuotasPorInscripcion,
  obtenerCuotaPorId,
  obtenerCuotaPorReferencia,
  obtenerInscripcion,
  obtenerInscripcionPorId,
  contarCuotasActivas,
  registrarCuota,
  actualizarTotalPagado,
  anularCuota,
  editarCuota,
  obtenerAuditoria,
};
