require("dotenv").config();
const app = require("./src/app");
const { inicializarBaseDeDatos } = require("./src/database/schema");

const PORT = process.env.PORT || 3000;

// Inicializar base de datos antes de arrancar el servidor
inicializarBaseDeDatos();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Presiona Ctrl+C para detener`);
});
