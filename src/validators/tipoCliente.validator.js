'use strict';

const ApiError = require('../utils/apiError');

const ESTADOS = ['activo', 'inactivo'];

const esPorcentaje = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;

function validarCrear(body = {}) {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  if (!nombre) throw new ApiError(400, 'El nombre del tipo de cliente es obligatorio.');
  if (body.porcentaje_descuento !== undefined && !esPorcentaje(body.porcentaje_descuento)) {
    throw new ApiError(400, 'porcentaje_descuento debe ser un número entre 0 y 100.');
  }
  if (body.estado !== undefined && !ESTADOS.includes(body.estado)) {
    throw new ApiError(400, `El estado debe ser uno de: ${ESTADOS.join(', ')}.`);
  }
  return { nombre, porcentajeDescuento: body.porcentaje_descuento, estado: body.estado };
}

function validarActualizar(body = {}) {
  const cambios = {};
  if (body.nombre !== undefined) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    if (!nombre) throw new ApiError(400, 'El nombre no puede estar vacío.');
    cambios.nombre = nombre;
  }
  if (body.porcentaje_descuento !== undefined) {
    if (!esPorcentaje(body.porcentaje_descuento)) {
      throw new ApiError(400, 'porcentaje_descuento debe ser un número entre 0 y 100.');
    }
    cambios.porcentajeDescuento = body.porcentaje_descuento;
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
