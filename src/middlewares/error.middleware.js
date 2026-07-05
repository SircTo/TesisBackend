'use strict';

/**
 * Maneja rutas no encontradas (404).
 */
function notFound(req, res, next) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

/**
 * Manejador central de errores. Cualquier error pasado a next(err) o lanzado
 * en un handler asíncrono (con captura) llega aquí.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const mensaje = status === 500 ? 'Error interno del servidor.' : err.message;

  if (status === 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(status).json({ message: mensaje });
}

module.exports = { notFound, errorHandler };
