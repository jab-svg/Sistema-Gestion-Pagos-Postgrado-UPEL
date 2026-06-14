const repo = require("./tasa.repository");

// URL de la API de terceros para obtener tasa BCV
const BCV_API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

async function obtenerTasaBCV() {
  try {
    const response = await fetch(BCV_API_URL);
    if (!response.ok) {
      throw new Error("La API no respondió correctamente");
    }
    const data = await response.json();
    // La API devuelve { promedio: 36.58, ... }
    return {
      tasa: data.promedio,
      fuente: "BCV-AUTO",
    };
  } catch (error) {
    throw {
      status: 503,
      mensaje:
        "No se pudo obtener la tasa del BCV automáticamente. Ingresa la tasa de forma manual.",
    };
  }
}

async function sincronizarDesdeBCV(usuario) {
  const { tasa, fuente } = await obtenerTasaBCV();

  if (!tasa || isNaN(tasa) || tasa <= 0) {
    throw { status: 502, mensaje: "La tasa obtenida del BCV no es válida" };
  }

  const id = repo.registrar(tasa, fuente, usuario);
  return repo.obtenerPorId(id);
}

function registrarManual(datos, usuario) {
  const { tasa_bs, nota } = datos;

  if (!tasa_bs) {
    throw { status: 400, mensaje: "La tasa es requerida" };
  }
  if (isNaN(tasa_bs) || Number(tasa_bs) <= 0) {
    throw { status: 400, mensaje: "La tasa debe ser un número positivo" };
  }

  const fuente = nota ? `MANUAL: ${nota}` : "MANUAL";
  const id = repo.registrar(Number(tasa_bs), fuente, usuario);
  return repo.obtenerPorId(id);
}

function tasaVigente() {
  const tasa = repo.obtenerTasaVigente();
  if (!tasa) {
    throw {
      status: 404,
      mensaje:
        "No hay ninguna tasa registrada. Registra la tasa BCV antes de continuar.",
    };
  }
  return tasa;
}

function historial() {
  return repo.obtenerHistorial();
}

module.exports = {
  sincronizarDesdeBCV,
  registrarManual,
  tasaVigente,
  historial,
};
