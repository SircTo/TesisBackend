'use strict';

const ApiError = require('../utils/apiError');

const ROLES = ['administrador', 'garzon', 'jefe_cocina'];
const ESTADOS = ['activo', 'inactivo'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;

function validarLogin(body = {}) {
  const correo = typeof body.correo === 'string' ? body.correo.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!correo || !password) {
    throw new ApiError(400, 'Correo y contraseña son obligatorios.');
  }
  return { correo, password };
}

function validarCrear(body = {}) {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const correo = typeof body.correo === 'string' ? body.correo.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!nombre) throw new ApiError(400, 'El nombre es obligatorio.');
  if (!EMAIL_RE.test(correo)) throw new ApiError(400, 'El correo no es válido.');
  if (password.length < PASSWORD_MIN) {
    throw new ApiError(400, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
  }
  if (!ROLES.includes(body.rol)) {
    throw new ApiError(400, `El rol debe ser uno de: ${ROLES.join(', ')}.`);
  }
  if (body.estado !== undefined && !ESTADOS.includes(body.estado)) {
    throw new ApiError(400, `El estado debe ser uno de: ${ESTADOS.join(', ')}.`);
  }

  return { nombre, correo, password, rol: body.rol, estado: body.estado };
}

function validarActualizar(body = {}) {
  const cambios = {};

  if (body.nombre !== undefined) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    if (!nombre) throw new ApiError(400, 'El nombre no puede estar vacío.');
    cambios.nombre = nombre;
  }
  if (body.rol !== undefined) {
    if (!ROLES.includes(body.rol)) throw new ApiError(400, `El rol debe ser uno de: ${ROLES.join(', ')}.`);
    cambios.rol = body.rol;
  }
  if (body.estado !== undefined) {
    if (!ESTADOS.includes(body.estado)) throw new ApiError(400, `El estado debe ser uno de: ${ESTADOS.join(', ')}.`);
    cambios.estado = body.estado;
  }
  if (body.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < PASSWORD_MIN) {
      throw new ApiError(400, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
    }
    cambios.password = body.password;
  }

  if (Object.keys(cambios).length === 0) {
    throw new ApiError(400, 'No se enviaron cambios para actualizar.');
  }
  return cambios;
}

module.exports = { validarLogin, validarCrear, validarActualizar };
