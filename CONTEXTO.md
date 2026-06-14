# SGPP UPEL — Sistema de Gestión de Pagos de Postgrado

## Contexto para continuación de desarrollo

### Stack tecnológico

- **Backend:** Node.js + Express 5 + SQLite (better-sqlite3)
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Frontend:** HTML + CSS + JS vanilla (sin frameworks)
- **Arquitectura:** routes → service → repository (3 capas)
- **Puerto:** 3000

### Estructura del proyecto

sgppupel/
├── public/
│ ├── index.html ← login
│ ├── css/
│ │ ├── main.css
│ │ └── sidebar.css
│ ├── js/
│ │ ├── api.js ← fetch centralizado + helpers
│ │ └── auth.js ← manejo de token JWT
│ ├── img/
│ │ ├── upel-logo.png
│ │ └── upel-banner.png
│ └── pages/
│ ├── dashboard.html
│ ├── maestrias.html
│ ├── estudiantes.html
│ ├── pagos.html
│ ├── tasa.html
│ ├── reportes.html
│ └── usuarios.html
├── src/
│ ├── app.js
│ ├── config/
│ │ ├── database.js ← singleton SQLite
│ │ └── auth.js ← generarToken / verificarToken
│ ├── database/
│ │ └── schema.js ← crea tablas + usuario admin por defecto
│ ├── middleware/
│ │ └── auth.js ← verifica JWT en cada petición
│ └── modules/
│ ├── auth/ ← login / logout
│ ├── usuarios/ ← CRUD usuarios del sistema
│ ├── maestrias/ ← CRUD maestrías + períodos
│ ├── estudiantes/ ← registro + búsqueda por CI
│ ├── pagos/ ← cuotas + anulación + auditoría
│ ├── tasa/ ← tasa BCV automática y manual
│ └── reportes/ ← exportar CSV
├── server.js
├── .env ← PORT, JWT_SECRET, JWT_EXPIRES_IN
└── database.db ← SQLite local (en .gitignore)

### Tablas de la BD (SQLite)

- `usuarios` — usuarios del sistema con roles (admin/superadmin)
- `maestrias` — programas de postgrado (soft delete con campo activa)
- `periodos` — períodos académicos por maestría, UNIQUE(codigo, maestria_id)
- `alumnos` — estudiantes registrados
- `inscripciones` — alumno inscrito en un período (estados: PENDIENTE, PAGADO_PARCIAL, SOLVENTE)
- `cuotas` — pagos individuales (máx 3 por inscripción, estados: PAGADO, ANULADO)
- `tasas_cambio` — historial de tasas BCV
- `auditoria_pagos` — registro de anulaciones y ediciones

### Endpoints disponibles

POST /api/auth/login
GET /api/usuarios
POST /api/usuarios
PUT /api/usuarios/:id
PUT /api/usuarios/:id/password
PATCH /api/usuarios/:id/estado
GET /api/maestrias
POST /api/maestrias
PUT /api/maestrias/:id
DELETE /api/maestrias/:id
GET /api/maestrias/:id/periodos
POST /api/maestrias/:id/periodos
PUT /api/maestrias/:maestriaId/periodos/:id
PATCH /api/maestrias/:maestriaId/periodos/:id/estado
GET /api/estudiantes
GET /api/estudiantes/ci/:cedula
GET /api/estudiantes/:id
POST /api/estudiantes
PUT /api/estudiantes/:id
GET /api/pagos/inscripcion/:id
POST /api/pagos
PUT /api/pagos/:id
PATCH /api/pagos/:id/anular
GET /api/tasa/vigente
GET /api/tasa/historial
POST /api/tasa/bcv
POST /api/tasa/manual
GET /api/reportes/maestria/:id?periodo_id=X
GET /api/reportes/estudiante/:cedula

### Decisiones de diseño importantes

- Períodos: UNIQUE(codigo, maestria_id) — el mismo código puede existir en maestrías distintas
- Soft delete en maestrías y usuarios (campo activa/activo)
- Períodos se activan/desactivan manualmente por el admin
- Tasa BCV: intento automático vía ve.dolarapi.com, fallback manual
- Cuotas: máximo 3 por inscripción, conversión Bs automática con tasa vigente
- Anulaciones: no se borran, cambian estado a ANULADO y restan del total
- JWT expira en 8h (configurado en .env)
- Frontend usa localStorage para guardar token y datos del usuario

### Estado actual del desarrollo

- ✅ Backend completo y funcional
- ✅ Frontend completo con colores institucionales UPEL (azul #2b6cb0 / verde #276749)
- ✅ Login funcional
- ✅ Módulo maestrías + períodos funcional
- ✅ Módulo estudiantes funcional (editar resuelto)
- ✅ Módulo pagos funcional (nombre y período se muestran correctamente)
- ✅ Módulo tasa BCV funcional (auto + manual)
- ✅ Módulo reportes CSV funcional
- ✅ Módulo usuarios funcional
- ✅ Git inicializado (repositorio local)

### Pendiente

- ⬜ Reportes en PDF con membrete institucional UPEL (puppeteer)
- ⬜ Resumen de ingresos por período (todas las maestrías juntas)
- ⬜ Pruebas completas del sistema (bloques 3-6 pendientes)
- ⬜ Empaquetado con Electron para generar .exe instalable

### Credenciales por defecto

- Usuario: admin
- Contraseña: admin123
- Rol: superadmin

### Comandos

```bash
npm run dev    # arrancar en modo desarrollo (nodemon)
npm start      # arrancar en producción
git add . && git commit -m "descripcion"  # guardar cambios
```

### Notas técnicas

- Express 5 — catch-all usa /{_path} en vez de _
- better-sqlite3 es síncrono (no usa async/await para BD)
- Solo tasa.service.js usa async/await (llamada externa a API BCV)
- foreign_keys = ON activado manualmente (SQLite lo desactiva por defecto)
- BOM (\uFEFF) agregado a CSVs para compatibilidad con Excel en Windows
