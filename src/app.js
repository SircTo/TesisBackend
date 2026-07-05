'use strict';

const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// --- Middlewares globales ---
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json()); // parsea cuerpos JSON
app.use(express.urlencoded({ extended: true }));

// --- Rutas de la API ---
// Todas las rutas del sistema quedan bajo el prefijo /api
app.use('/api', routes);

// --- Manejo de errores ---
app.use(notFound); // 404 para rutas no encontradas
app.use(errorHandler); // manejador central de errores

module.exports = app;
