const { getDatabase } = require("../../config/database");

function buscarUsuarioPorUsername(username) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT * FROM usuarios
        WHERE username = ? AND activo = 1
    `,
    )
    .get(username);
}

module.exports = { buscarUsuarioPorUsername };
