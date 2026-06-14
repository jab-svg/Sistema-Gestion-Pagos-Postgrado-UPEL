const bcrypt = require("bcryptjs");
const { generarToken } = require("../../config/auth");
const { buscarUsuarioPorUsername } = require("./auth.repository");

function login(username, password) {
  // 1. Verificar que llegaron los datos
  if (!username || !password) {
    throw { status: 400, mensaje: "Usuario y contraseña son requeridos" };
  }

  // 2. Buscar el usuario en la BD
  const usuario = buscarUsuarioPorUsername(username);
  if (!usuario) {
    throw { status: 401, mensaje: "Credenciales incorrectas" };
  }

  // 3. Verificar la contraseña
  const passwordValida = bcrypt.compareSync(password, usuario.password);
  if (!passwordValida) {
    throw { status: 401, mensaje: "Credenciales incorrectas" };
  }

  // 4. Generar token con la info del usuario
  const token = generarToken({
    id: usuario.id,
    nombre: usuario.nombre,
    username: usuario.username,
    rol: usuario.rol,
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      username: usuario.username,
      rol: usuario.rol,
    },
  };
}

module.exports = { login };
