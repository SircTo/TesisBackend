'use strict';

// Carga las variables definidas en el archivo .env hacia process.env
require('dotenv').config();

// Variables obligatorias para que el sistema funcione.
// Si falta alguna, es mejor fallar al inicio que más adelante de forma confusa.
const REQUERIDAS = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];

const faltantes = REQUERIDAS.filter((clave) => !process.env[clave]);
if (faltantes.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    `[config] Faltan variables de entorno requeridas: ${faltantes.join(', ')}.\n` +
      'Crea un archivo .env basándote en .env.example.'
  );
  process.exit(1);
}

const env = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = env;
