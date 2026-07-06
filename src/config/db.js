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
 * Ejecuta una función dentro de una transacción. Recibe un `client` con el que
 * deben hacerse todas las consultas de la transacción. Hace COMMIT si termina
 * bien y ROLLBACK si algo falla.
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await callback(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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

module.exports = { pool, query, withTransaction, testConnection };
