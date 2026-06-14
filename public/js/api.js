const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("sgpp_token");
}

function getUsuario() {
  const u = localStorage.getItem("sgpp_usuario");
  return u ? JSON.parse(u) : null;
}

function guardarSesion(token, usuario) {
  localStorage.setItem("sgpp_token", token);
  localStorage.setItem("sgpp_usuario", JSON.stringify(usuario));
}

function cerrarSesion() {
  localStorage.removeItem("sgpp_token");
  localStorage.removeItem("sgpp_usuario");
  window.location.href = "/index.html";
}

function verificarAuth() {
  if (!getToken()) {
    window.location.href = "/index.html";
    return false;
  }
  return true;
}

async function api(method, endpoint, body = null) {
  const token = getToken();
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  const data = await res.json();

  // Token expirado
  if (res.status === 401) {
    cerrarSesion();
    return;
  }

  if (!data.ok) throw new Error(data.mensaje || "Error desconocido");
  return data;
}

// Helpers por verbo
const get = (ep) => api("GET", ep);
const post = (ep, body) => api("POST", ep, body);
const put = (ep, body) => api("PUT", ep, body);
const patch = (ep, body) => api("PATCH", ep, body);
const del = (ep) => api("DELETE", ep);

// Poblar select con opciones
function poblarSelect(
  selectEl,
  items,
  valueKey,
  labelKey,
  placeholder = "Seleccionar...",
) {
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item[valueKey];
    opt.textContent = item[labelKey];
    selectEl.appendChild(opt);
  });
}

// Mostrar alerta temporal
function mostrarAlerta(contenedor, mensaje, tipo = "danger") {
  contenedor.innerHTML = `
        <div class="alert alert-${tipo}">
            ${mensaje}
        </div>`;
  setTimeout(() => {
    contenedor.innerHTML = "";
  }, 4000);
}

// Formatear fecha
function formatFecha(str) {
  if (!str) return "—";
  /*return new Date(str).toLocaleDateString("es-VE");*/
  // Evitar conversión de zona horaria agregando T00:00:00
  // y usando los componentes de fecha directamente
  const [year, month, day] = str.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

// Formatear moneda
function formatUSD(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}
function formatBS(n) {
  return `Bs. ${Number(n || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;
}
