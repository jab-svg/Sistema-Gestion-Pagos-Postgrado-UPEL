const repo = require("./pagos.repository");
const tasaRepo = require("../tasa/tasa.repository");
const estudRepo = require("../estudiantes/estudiantes.repository");

function obtenerPagosPorInscripcion(inscripcion_id) {
  const inscripcion = repo.obtenerInscripcionPorId(inscripcion_id);
  if (!inscripcion) {
    throw { status: 404, mensaje: "Inscripción no encontrada" };
  }

  const cuotas = repo.obtenerCuotasPorInscripcion(inscripcion_id);
  const auditoria = repo.obtenerAuditoria(inscripcion_id);

  // Calcular estado de solvencia
  const solvente = inscripcion.total_pagado >= inscripcion.costo_aplicado;

  return {
    inscripcion,
    cuotas,
    auditoria,
    solvente,
    saldo_pendiente: inscripcion.costo_aplicado - inscripcion.total_pagado,
  };
}

function registrarPago(datos, usuario) {
  const { inscripcion_id, numero, fecha_pago, monto_usd, referencia } = datos;

  // Validaciones — HU03
  if (!inscripcion_id || !numero || !fecha_pago || !monto_usd || !referencia) {
    throw { status: 400, mensaje: "Todos los campos son requeridos" };
  }
  if (isNaN(monto_usd) || Number(monto_usd) <= 0) {
    throw { status: 400, mensaje: "El monto debe ser un número positivo" };
  }
  if (isNaN(numero) || ![1, 2, 3].includes(Number(numero))) {
    throw { status: 400, mensaje: "El número de cuota debe ser 1, 2 o 3" };
  }
  if (isNaN(referencia)) {
    throw { status: 400, mensaje: "La referencia debe ser numérica" };
  }

  // Verificar fecha válida
  const fecha = new Date(fecha_pago);
  if (isNaN(fecha.getTime())) {
    throw { status: 400, mensaje: "La fecha no tiene un formato válido" };
  }

  // Verificar que la inscripción existe
  const inscripcion = repo.obtenerInscripcionPorId(inscripcion_id);
  if (!inscripcion) {
    throw { status: 404, mensaje: "Inscripción no encontrada" };
  }

  // Verificar que no exceda 3 cuotas activas — HU03
  const totalCuotas = repo.contarCuotasActivas(inscripcion_id);
  if (totalCuotas >= 3) {
    throw {
      status: 400,
      mensaje: "Esta inscripción ya tiene 3 cuotas registradas",
    };
  }

  // Verificar referencia duplicada — HU03
  const refExistente = repo.obtenerCuotaPorReferencia(referencia);
  if (refExistente) {
    throw { status: 409, mensaje: "El número de referencia ya existe" };
  }

  // Obtener tasa vigente — HU03
  const tasa = tasaRepo.obtenerTasaVigente();
  if (!tasa) {
    throw {
      status: 400,
      mensaje:
        "No hay tasa BCV registrada. Registra la tasa antes de procesar pagos.",
    };
  }

  // Calcular monto en bolívares automáticamente
  const monto_bs = Number(monto_usd) * tasa.tasa_bs;

  // Registrar la cuota
  const db = require("../../config/database").getDatabase();

  const transaction = db.transaction(() => {
    const cuota_id = repo.registrarCuota(
      inscripcion_id,
      Number(numero),
      fecha_pago,
      Number(monto_usd),
      Number(monto_bs.toFixed(2)),
      referencia,
      tasa.id,
    );
    // Recalcular total pagado y estado de solvencia
    const { total, estado } = repo.actualizarTotalPagado(inscripcion_id);
    return { cuota_id, total, estado };
  });

  const resultado = transaction();
  return {
    cuota: repo.obtenerCuotaPorId(resultado.cuota_id),
    total_pagado: resultado.total,
    estado: resultado.estado,
    tasa_aplicada: tasa.tasa_bs,
    monto_bs_calculado: Number(monto_bs.toFixed(2)),
  };
}

function anularPago(id, datos, usuario) {
  const { motivo } = datos;

  if (!motivo || motivo.trim() === "") {
    throw { status: 400, mensaje: "El motivo de anulación es requerido" };
  }

  const cuota = repo.obtenerCuotaPorId(id);
  if (!cuota) {
    throw { status: 404, mensaje: "Cuota no encontrada" };
  }
  if (cuota.estado === "ANULADO") {
    throw { status: 400, mensaje: "Esta cuota ya está anulada" };
  }

  const db = require("../../config/database").getDatabase();

  const transaction = db.transaction(() => {
    repo.anularCuota(id, motivo.trim(), usuario);
    repo.actualizarTotalPagado(cuota.inscripcion_id);
  });

  transaction();
  return { mensaje: "Pago anulado correctamente" };
}

function editarPago(id, datos, usuario) {
  const { fecha_pago, monto_usd, referencia, motivo } = datos;

  if (!motivo || motivo.trim() === "") {
    throw { status: 400, mensaje: "El motivo de edición es requerido" };
  }
  if (!fecha_pago || !monto_usd || !referencia) {
    throw { status: 400, mensaje: "Fecha, monto y referencia son requeridos" };
  }
  if (isNaN(monto_usd) || Number(monto_usd) <= 0) {
    throw { status: 400, mensaje: "El monto debe ser un número positivo" };
  }

  const cuota = repo.obtenerCuotaPorId(id);
  if (!cuota) {
    throw { status: 404, mensaje: "Cuota no encontrada" };
  }
  if (cuota.estado === "ANULADO") {
    throw { status: 400, mensaje: "No se puede editar una cuota anulada" };
  }

  // Si cambia la referencia, verificar que no exista — HU06
  if (referencia !== cuota.referencia) {
    const refExistente = repo.obtenerCuotaPorReferencia(referencia);
    if (refExistente) {
      throw { status: 409, mensaje: "El número de referencia ya existe" };
    }
  }

  // Recalcular monto en Bs con la tasa original del pago
  const monto_bs = Number(monto_usd) * cuota.tasa_bs;

  const db = require("../../config/database").getDatabase();

  const transaction = db.transaction(() => {
    repo.editarCuota(
      id,
      {
        fecha_pago,
        monto_usd: Number(monto_usd),
        monto_bs: Number(monto_bs.toFixed(2)),
        referencia,
      },
      motivo.trim(),
      usuario,
    );
    repo.actualizarTotalPagado(cuota.inscripcion_id);
  });

  transaction();
  return repo.obtenerCuotaPorId(id);
}

module.exports = {
  obtenerPagosPorInscripcion,
  registrarPago,
  anularPago,
  editarPago,
};
