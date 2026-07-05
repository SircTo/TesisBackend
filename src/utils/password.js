'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Genera el hash de una contraseña en texto plano.
 */
function hashPassword(plano) {
  return bcrypt.hash(plano, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano contra su hash almacenado.
 */
function compararPassword(plano, hash) {
  return bcrypt.compare(plano, hash);
}

module.exports = { hashPassword, compararPassword };
