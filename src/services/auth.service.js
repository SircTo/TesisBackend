'use strict';

const usuarioModel = require('../models/usuario.model');
const { compararPassword } = require('../utils/password');
const { firmarToken } = require('../utils/jwt');
const ApiError = require('../utils/apiError');

/**
 * Valida credenciales y devuelve un token JWT junto con los datos públicos
 * del usuario (RF_01).
 */
async function login(correo, password) {
  const usuario = await usuarioModel.buscarPorCorreo(correo);
  // Mismo mensaje para correo inexistente o contraseña incorrecta (no revelar cuál falló).
  if (!usuario) throw new ApiError(401, 'Correo o contraseña incorrectos.');
  if (usuario.estado !== 'activo') throw new ApiError(403, 'La cuenta está inactiva.');

  const passwordOk = await compararPassword(password, usuario.password_hash);
  if (!passwordOk) throw new ApiError(401, 'Correo o contraseña incorrectos.');

  const token = firmarToken({ id: usuario.id, rol: usuario.rol, nombre: usuario.nombre });
  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
}

module.exports = { login };
