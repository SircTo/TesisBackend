'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Firma un token JWT con el payload dado (por ejemplo { id, rol, nombre }).
 * Usa el secreto y la expiración definidos en la configuración.
 */
function firmarToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

module.exports = { firmarToken };
