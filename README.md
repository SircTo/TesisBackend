# Backend

API REST para la aplicación de gestión del restaurante (registro de comandas, ventas e inventario).

## Stack

- **Node.js + Express.js** — servidor y lógica de negocio
- **PostgreSQL** (driver `pg`, SQL puro) — base de datos
- **JWT** (`jsonwebtoken`) — autenticación por rol
- **bcryptjs** — hash de contraseñas
- **CORS** — comunicación con el frontend (Angular)

## Estructura

```
src/
├── config/        # configuración: variables de entorno (env.js) y conexión a BD (db.js)
├── db/
│   ├── migrations/  # scripts .sql para crear las tablas
│   └── seeds/       # datos iniciales (roles, usuario admin, etc.)
├── models/        # consultas SQL por entidad
├── controllers/   # reciben la petición, validan y llaman a los services
├── services/      # lógica de negocio (reglas de los requerimientos)
├── routes/        # definición de endpoints (index.js los agrupa)
├── middlewares/   # autenticación (JWT), autorización por rol, manejo de errores
├── validators/    # validación de datos de entrada
├── utils/         # utilidades reutilizables
├── app.js         # configura Express (CORS, JSON, rutas, errores)
└── server.js      # arranca el servidor
```

**Flujo de una petición:** `routes` → `middlewares` (auth/rol) → `controllers` → `services` → `models` → `db`.

## Puesta en marcha

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear el archivo de variables de entorno a partir de la plantilla:
   ```bash
   cp .env.example .env
   ```
   Luego editar `.env` con los datos reales de la base de datos y un `JWT_SECRET`.
3. Tener una base de datos PostgreSQL creada con el nombre indicado en `DB_NAME`.
4. Levantar el servidor en modo desarrollo (recarga automática con nodemon):
   ```bash
   npm run dev
   ```
   O en modo normal:
   ```bash
   npm start
   ```
5. Verificar que responde: `GET http://localhost:3000/api/health` → `{ "status": "ok" }`.

## Pruebas

Las pruebas usan **Jest** y **Supertest**. Son pruebas de la API (rutas, autenticación,
autorización, validación y códigos de estado) con la **capa de modelos reemplazada por mocks**,
por lo que **no requieren conexión a la base de datos** ni contaminan datos reales.

```bash
npm test
```

