const repo = require("./estudiantes.repository");
const maestraRepo = require("../maestrias/maestrias.repository");

function listarEstudiantes(filtros) {
  return repo.obtenerTodos(filtros);
}

function buscarPorCI(cedula) {
  if (!cedula || isNaN(cedula)) {
    throw { status: 400, mensaje: "La cédula debe ser numérica" };
  }

  const alumno = repo.obtenerPorCI(cedula);
  if (!alumno) {
    throw { status: 404, mensaje: "Estudiante no encontrado" };
  }

  // Traer sus inscripciones con detalle de cuotas
  const inscripciones = repo.obtenerInscripciones(alumno.id);

  return { ...alumno, inscripciones };
}

function registrarEstudiante(datos) {
  const {
    cedula,
    nombres,
    apellidos,
    telefono,
    email,
    maestria_id,
    periodo_id,
  } = datos;

  // Validaciones obligatorias — HU01
  if (!cedula || !nombres || !apellidos || !maestria_id || !periodo_id) {
    throw {
      status: 400,
      mensaje: "Cédula, nombres, apellidos, maestría y período son requeridos",
    };
  }
  if (isNaN(cedula)) {
    throw { status: 400, mensaje: "La cédula debe ser numérica" };
  }

  // Verificar que la cédula no exista — HU01
  const existente = repo.obtenerPorCI(cedula);
  if (existente) {
    throw { status: 409, mensaje: "Ya existe un estudiante con esa cédula" };
  }

  // Verificar que la maestría existe y está activa
  const maestria = maestraRepo.obtenerPorId(maestria_id);
  if (!maestria || !maestria.activa) {
    throw { status: 404, mensaje: "Maestría no encontrada o inactiva" };
  }

  // Verificar que el período existe y pertenece a esa maestría
  const periodo = maestraRepo.obtenerPeriodoPorId(periodo_id);
  if (!periodo || periodo.maestria_id != maestria_id) {
    throw {
      status: 404,
      mensaje: "Período no encontrado o no pertenece a esa maestría",
    };
  }

  // Crear alumno e inscribirlo en el período en una transacción
  const db = require("../../config/database").getDatabase();

  const transaction = db.transaction(() => {
    const alumno_id = repo.crear(
      cedula,
      nombres.trim(),
      apellidos.trim(),
      telefono || null,
      email || null,
      maestria_id,
    );
    const inscripcion_id = repo.inscribir(
      alumno_id,
      periodo_id,
      periodo.costo_usd,
    );
    return { alumno_id, inscripcion_id };
  });

  const { alumno_id } = transaction();
  return repo.obtenerPorId(alumno_id);
}

function actualizarEstudiante(id, datos) {
  const { nombres, apellidos, telefono, email } = datos;

  if (!nombres || !apellidos) {
    throw { status: 400, mensaje: "Nombres y apellidos son requeridos" };
  }

  const alumno = repo.obtenerPorId(id);
  if (!alumno) {
    throw { status: 404, mensaje: "Estudiante no encontrado" };
  }

  repo.actualizar(id, nombres.trim(), apellidos.trim(), telefono, email);
  return repo.obtenerPorId(id);
}

module.exports = {
  listarEstudiantes,
  buscarPorCI,
  registrarEstudiante,
  actualizarEstudiante,
};
