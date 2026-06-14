const repo = require("./maestrias.repository");

// ── Maestrías ─────────────────────────────────────────────

function listarMaestrias() {
  return repo.obtenerTodas();
}

function obtenerMaestria(id) {
  const maestria = repo.obtenerPorId(id);
  if (!maestria) {
    throw { status: 404, mensaje: "Maestría no encontrada" };
  }
  return maestria;
}

function crearMaestria(datos) {
  const { nombre } = datos;

  if (!nombre || nombre.trim() === "") {
    throw { status: 400, mensaje: "El nombre de la maestría es requerido" };
  }

  const existente = repo.obtenerPorNombre(nombre.trim());
  if (existente) {
    throw { status: 409, mensaje: "Ya existe una maestría con ese nombre" };
  }

  const id = repo.crear(nombre.trim());
  return repo.obtenerPorId(id);
}

function actualizarMaestria(id, datos) {
  const { nombre } = datos;

  if (!nombre || nombre.trim() === "") {
    throw { status: 400, mensaje: "El nombre de la maestría es requerido" };
  }

  const maestria = repo.obtenerPorId(id);
  if (!maestria) {
    throw { status: 404, mensaje: "Maestría no encontrada" };
  }

  // Verificar que el nuevo nombre no lo tenga otra maestría
  const existente = repo.obtenerPorNombre(nombre.trim());
  if (existente && existente.id != id) {
    throw { status: 409, mensaje: "Ya existe una maestría con ese nombre" };
  }

  repo.actualizar(id, nombre.trim());
  return repo.obtenerPorId(id);
}

/*function eliminarMaestria(id) {
  const maestria = repo.obtenerPorId(id);
  if (!maestria) {
    throw { status: 404, mensaje: "Maestría no encontrada" };
  }

  // No se puede eliminar si tiene estudiantes — del diagrama de actividades HU02
  if (repo.tieneEstudiantes(id)) {
    throw {
      status: 409,
      mensaje: "No se puede eliminar una maestría con estudiantes registrados",
    };
  }

  // Soft delete — solo se desactiva, no se borra
  repo.cambiarEstado(id, 0);
  return { mensaje: "Maestría desactivada correctamente" };
}*/

function eliminarMaestria(id) {
  const maestria = repo.obtenerPorId(id);
  if (!maestria) {
    throw { status: 404, mensaje: "Maestría no encontrada" };
  }

  // Si está activa, verificar que no tenga estudiantes antes de desactivar
  if (maestria.activa && repo.tieneEstudiantes(id)) {
    throw {
      status: 409,
      mensaje:
        "No se puede desactivar una maestría con estudiantes registrados",
    };
  }

  // Toggle — si está activa la desactiva, si está inactiva la reactiva
  const nuevoEstado = maestria.activa === 1 ? 0 : 1;
  repo.cambiarEstado(id, nuevoEstado);
  return {
    mensaje:
      nuevoEstado === 1
        ? "Maestría reactivada correctamente"
        : "Maestría desactivada correctamente",
  };
}

// ── Períodos ──────────────────────────────────────────────

function listarPeriodos(maestria_id) {
  // Verificar que la maestría existe
  const maestria = repo.obtenerPorId(maestria_id);
  if (!maestria) {
    throw { status: 404, mensaje: "Maestría no encontrada" };
  }
  return repo.obtenerPeriodos(maestria_id);
}

function crearPeriodo(maestria_id, datos) {
  const { codigo, costo_usd } = datos;

  if (!codigo || !costo_usd) {
    throw { status: 400, mensaje: "Código y costo son requeridos" };
  }
  if (isNaN(costo_usd) || Number(costo_usd) <= 0) {
    throw { status: 400, mensaje: "El costo debe ser un número positivo" };
  }

  // Verificar formato del código — debe ser YYYY-N
  const formatoCodigo = /^\d{4}-\d+$/;
  if (!formatoCodigo.test(codigo)) {
    throw {
      status: 400,
      mensaje: "El código debe tener formato YYYY-N (ej: 2026-1)",
    };
  }

  const maestria = repo.obtenerPorId(maestria_id);
  if (!maestria) {
    throw { status: 404, mensaje: "Maestría no encontrada" };
  }

  // Verificar que no exista ese código para esa maestría
  const existente = repo.obtenerPeriodoPorCodigo(codigo, maestria_id);
  if (existente) {
    throw {
      status: 409,
      mensaje: "Ya existe un período con ese código en esta maestría",
    };
  }

  const id = repo.crearPeriodo(maestria_id, codigo, Number(costo_usd));
  return repo.obtenerPeriodoPorId(id);
}

function actualizarPeriodo(id, datos) {
  const { codigo, costo_usd } = datos;

  if (!codigo || !costo_usd) {
    throw { status: 400, mensaje: "Código y costo son requeridos" };
  }
  if (isNaN(costo_usd) || Number(costo_usd) <= 0) {
    throw { status: 400, mensaje: "El costo debe ser un número positivo" };
  }

  const periodo = repo.obtenerPeriodoPorId(id);
  if (!periodo) {
    throw { status: 404, mensaje: "Período no encontrado" };
  }

  // Si tiene inscripciones, no se puede cambiar el costo — HU07
  if (
    repo.periodoTieneInscripciones(id) &&
    Number(costo_usd) !== periodo.costo_usd
  ) {
    throw {
      status: 409,
      mensaje:
        "No se puede modificar el costo de un período con inscripciones activas",
    };
  }

  repo.actualizarPeriodo(id, codigo, Number(costo_usd));
  return repo.obtenerPeriodoPorId(id);
}

//---------activar o desactivar perioddo
function togglePeriodo(id) {
  const periodo = repo.obtenerPeriodoPorId(id);
  if (!periodo) {
    throw { status: 404, mensaje: "Período no encontrado" };
  }

  // No se puede desactivar un período con inscripciones activas-----se elimina esta parte para evitar errores
  /*if (periodo.activo === 1 && repo.periodoTieneInscripciones(id)) {
    throw {
      status: 409,
      mensaje: "No se puede cerrar un período con inscripciones activas",
    };
  }*/

  const nuevoEstado = periodo.activo === 1 ? 0 : 1;
  repo.cambiarEstadoPeriodo(id, nuevoEstado);
  return {
    mensaje: nuevoEstado === 1 ? "Período activado" : "Período cerrado",
    activo: nuevoEstado,
  };
}

module.exports = {
  listarMaestrias,
  obtenerMaestria,
  crearMaestria,
  actualizarMaestria,
  eliminarMaestria,
  listarPeriodos,
  crearPeriodo,
  actualizarPeriodo,
  togglePeriodo,
};
