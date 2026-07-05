'use strict';

const { Pool } = require('pg');
const env = require('./env');

// Pool de conexiones a PostgreSQL. Se reutiliza en toda la aplicación
// para no abrir una conexión nueva por cada consulta.
const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  // Algunas bases (hosting/Coolify) exigen SSL. rejectUnauthorized:false acepta
  // certificados autofirmados, habitual en entornos gestionados.
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] Error inesperado en el pool de PostgreSQL:', err.message);
});

/**
 * Ejecuta una consulta SQL parametrizada.
 * Usar SIEMPRE parámetros ($1, $2, ...) para evitar inyección SQL.
 * @param {string} text  Consulta SQL con placeholders ($1, $2, ...)
 * @param {Array} [params]  Valores para los placeholders
 * @returns {Promise<import('pg').QueryResult>}
 */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Verifica que la conexión a la base de datos funcione.
 * Se llama al arrancar el servidor.
 */
async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

module.exports = { pool, query, testConnection };
