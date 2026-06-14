const bcrypt = require("bcryptjs");
const repo = require("./usuarios.repository");

function listarUsuarios() {
  return repo.obtenerTodos();
}

function obtenerUsuario(id) {
  const usuario = repo.obtenerPorId(id);
  if (!usuario) {
    throw { status: 404, mensaje: "Usuario no encontrado" };
  }
  return usuario;
}

function crearUsuario(datos, usuarioActual) {
  const { nombre, username, password, rol } = datos;

  // Validaciones
  if (!nombre || !username || !password || !rol) {
    throw { status: 400, mensaje: "Todos los campos son requeridos" };
  }
  if (password.length < 6) {
    throw {
      status: 400,
      mensaje: "La contraseña debe tener al menos 6 caracteres",
    };
  }
  if (!["admin", "superadmin"].includes(rol)) {
    throw { status: 400, mensaje: "Rol no válido" };
  }

  // Solo superadmin puede crear superadmins
  if (rol === "superadmin" && usuarioActual.rol !== "superadmin") {
    throw { status: 403, mensaje: "No tienes permiso para asignar ese rol" };
  }

  // Verificar que el username no exista
  const existente = repo.obtenerPorUsername(username);
  if (existente) {
    throw { status: 409, mensaje: "El nombre de usuario ya está en uso" };
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const id = repo.crear(nombre, username, passwordHash, rol);
  return repo.obtenerPorId(id);
}

function actualizarUsuario(id, datos, usuarioActual) {
  const { nombre, rol } = datos;

  if (!nombre || !rol) {
    throw { status: 400, mensaje: "Nombre y rol son requeridos" };
  }

  // No puede editarse a sí mismo el rol
  if (id == usuarioActual.id && rol !== usuarioActual.rol) {
    throw { status: 400, mensaje: "No puedes cambiar tu propio rol" };
  }

  const usuario = repo.obtenerPorId(id);
  if (!usuario) {
    throw { status: 404, mensaje: "Usuario no encontrado" };
  }

  repo.actualizar(id, nombre, rol);
  return repo.obtenerPorId(id);
}

function cambiarPassword(id, datos, usuarioActual) {
  const { passwordActual, passwordNueva } = datos;

  if (!passwordActual || !passwordNueva) {
    throw { status: 400, mensaje: "Ambas contraseñas son requeridas" };
  }
  if (passwordNueva.length < 6) {
    throw {
      status: 400,
      mensaje: "La nueva contraseña debe tener al menos 6 caracteres",
    };
  }

  // Solo el propio usuario o un superadmin puede cambiar la contraseña
  const esPropioUsuario = id == usuarioActual.id;
  const esSuperAdmin = usuarioActual.rol === "superadmin";

  if (!esPropioUsuario && !esSuperAdmin) {
    throw {
      status: 403,
      mensaje: "No tienes permiso para cambiar esta contraseña",
    };
  }

  // Si es el propio usuario, verificar contraseña actual
  if (esPropioUsuario) {
    const usuario = repo.obtenerPorId(id);
    const db = require("../../config/database").getDatabase();
    const conPass = db
      .prepare("SELECT password FROM usuarios WHERE id = ?")
      .get(id);
    const valida = bcrypt.compareSync(passwordActual, conPass.password);
    if (!valida) {
      throw { status: 401, mensaje: "La contraseña actual es incorrecta" };
    }
  }

  const hash = bcrypt.hashSync(passwordNueva, 10);
  repo.actualizarPassword(id, hash);
  return { mensaje: "Contraseña actualizada correctamente" };
}

function toggleEstado(id, usuarioActual) {
  // No puede desactivarse a sí mismo
  if (id == usuarioActual.id) {
    throw { status: 400, mensaje: "No puedes desactivar tu propia cuenta" };
  }

  const usuario = repo.obtenerPorId(id);
  if (!usuario) {
    throw { status: 404, mensaje: "Usuario no encontrado" };
  }

  const nuevoEstado = usuario.activo === 1 ? 0 : 1;
  repo.cambiarEstado(id, nuevoEstado);
  return {
    mensaje: nuevoEstado === 1 ? "Usuario activado" : "Usuario desactivado",
    activo: nuevoEstado,
  };
}

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  cambiarPassword,
  toggleEstado,
};
