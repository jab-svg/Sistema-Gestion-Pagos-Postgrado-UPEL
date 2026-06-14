document.addEventListener("DOMContentLoaded", () => {
  // Si ya hay token válido, ir al dashboard
  if (localStorage.getItem("sgpp_token")) {
    window.location.href = "/pages/dashboard.html";
    return;
  }

  const form = document.getElementById("loginForm");
  const alertEl = document.getElementById("loginAlert");
  const btnEl = document.getElementById("btnLogin");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      mostrarAlerta(alertEl, "Ingresa usuario y contraseña", "danger");
      return;
    }

    btnEl.disabled = true;
    btnEl.textContent = "Verificando...";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.mensaje);

      guardarSesion(data.token, data.usuario);
      window.location.href = "/pages/dashboard.html";
    } catch (err) {
      mostrarAlerta(alertEl, err.message, "danger");
      btnEl.disabled = false;
      btnEl.textContent = "Iniciar sesión";
    }
  });
});
