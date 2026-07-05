'use strict';

/**
 * Error de aplicación con código de estado HTTP asociado.
 * Los services lanzan estos errores y el middleware de errores los traduce
 * a la respuesta correspondiente (400, 401, 404, 409, etc.).
 */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

module.exports = ApiError;
