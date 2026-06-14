const path = require("path");
const dotenv = require("dotenv");

// Cargar .env antes de todo
const envPath = process.resourcesPath
  ? path.join(process.resourcesPath, ".env")
  : path.join(__dirname, ".env");

dotenv.config({ path: envPath });

const { app, BrowserWindow, shell } = require("electron");

let mainWindow;

function startServer() {
  const { inicializarBaseDeDatos } = require("./src/database/schema");
  inicializarBaseDeDatos();

  const appExpress = require("./src/app");
  const PORT = process.env.PORT || 3000;
  appExpress.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "public", "img", "upel-logo.png"),
    title: "SGPP UPEL — Sistema de Gestión de Pagos de Postgrado",
    show: false,
  });

  mainWindow.loadURL("http://localhost:3000");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  try {
    startServer();
    createWindow();
  } catch (err) {
    console.error("Error al iniciar:", err);
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
