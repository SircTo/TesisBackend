'use strict';

const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

async function start() {
  try {
    // Verifica la conexión a PostgreSQL antes de levantar el servidor.
    await testConnection();
    // eslint-disable-next-line no-console
    console.log('[db] Conexión a PostgreSQL verificada.');

    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();
