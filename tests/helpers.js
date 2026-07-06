'use strict';

const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT válido para las pruebas, con el rol indicado.
 * Usa el mismo secreto que la app (definido en tests/setup.js).
 */
function tokenPara(rol = 'administrador', extra = {}) {
  return jwt.sign(
    { id: 1, rol, nombre: 'Usuario Test', ...extra },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

module.exports = { tokenPara };
