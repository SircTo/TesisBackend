'use strict';

const ApiError = require('../utils/apiError');

const ESTADOS = ['activo', 'inactivo'];

function validarCrear(body = {}) {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  if (!nombre) throw new ApiError(400, 'El nombre de la categoría es obligatorio.');
  if (body.estado !== undefined && !ESTADOS.includes(body.estado)) {
    throw new ApiError(400, `El estado debe ser uno de: ${ESTADOS.join(', ')}.`);
  }
  return { nombre, estado: body.estado };
}

function validarActualizar(body = {}) {
  const cambios = {};
  if (body.nombre !== undefined) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    if (!nombre) throw new ApiError(400, 'El nombre no puede estar vacío.');
    cambios.nombre = nombre;
  }
  if (body.estado !== undefined) {
    if (!ESTADOS.includes(body.estado)) {
      throw new ApiError(400, `El estado debe ser uno de: ${ESTADOS.join(', ')}.`);
    }
    cambios.estado = body.estado;
  }
  if (Object.keys(cambios).length === 0) {
    throw new ApiError(400, 'No se enviaron cambios para actualizar.');
  }
  return cambios;
}

module.exports = { validarCrear, validarActualizar };
