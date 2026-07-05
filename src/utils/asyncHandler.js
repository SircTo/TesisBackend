'use strict';

/**
 * Envuelve un controlador asíncrono para capturar errores y pasarlos a next(),
 * evitando repetir try/catch en cada controlador.
 *
 * Uso: router.post('/', asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
