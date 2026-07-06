'use strict';

// Variables de entorno mínimas para las pruebas.
// Se definen ANTES de cargar la app, por lo que dotenv (que no sobreescribe
// variables existentes) no las pisa. Las pruebas NO se conectan a la base real:
// la capa de modelos se reemplaza con mocks en cada archivo de test.
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'test';
process.env.DB_USER = process.env.DB_USER || 'test';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test';
process.env.DB_SSL = 'false';
process.env.JWT_SECRET = 'secreto-de-pruebas';
process.env.JWT_EXPIRES_IN = '1h';
