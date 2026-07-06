'use strict';

const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

async function start() {
  try {
    // Verifica la conexión a PostgreSQL antes de levantar el servidor.
    await testConnection();
    console.log('[db] Conexión a PostgreSQL verificada.');

    app.listen(env.port, () => {
      console.log(`[server] API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('[server] No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();
