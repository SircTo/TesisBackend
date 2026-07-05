'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Verifica el token JWT enviado en el header Authorization: "Bearer <token>".
 * Si es válido, agrega los datos del usuario a req.user y continúa.
 * Si no, responde 401.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = payload; // típicamente: { id, rol, ... }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
}

module.exports = { authenticate };
