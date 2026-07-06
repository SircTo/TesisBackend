'use strict';

const ApiError = require('../utils/apiError');

const ESTADOS = ['libre', 'ocupada', 'pagando'];

function esEnteroPositivo(valor) {
  return Number.isInteger(valor) && valor > 0;
}

function validarCrear(body = {}) {
  if (!esEnteroPositivo(body.numero)) {
    throw new ApiError(400, 'El número de mesa debe ser un entero positivo.');
  }
  if (!esEnteroPositivo(body.zona_id)) {
    throw new ApiError(400, 'zona_id debe ser un entero positivo.');
  }
  if (body.estado !== undefined && !ESTADOS.includes(body.estado)) {
    throw new ApiError(400, `El estado debe ser uno de: ${ESTADOS.join(', ')}.`);
  }
  return { numero: body.numero, zonaId: body.zona_id, estado: body.estado };
}

function validarActualizar(body = {}) {
  const cambios = {};
  if (body.numero !== undefined) {
    if (!esEnteroPositivo(body.numero)) {
      throw new ApiError(400, 'El número de mesa debe ser un entero positivo.');
    }
    cambios.numero = body.numero;
  }
  if (body.zona_id !== undefined) {
    if (!esEnteroPositivo(body.zona_id)) {
      throw new ApiError(400, 'zona_id debe ser un entero positivo.');
    }
    cambios.zonaId = body.zona_id;
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

/**
 * Valida el parámetro de consulta ?zona_id= para el filtro de listado.
 * Devuelve el id (número) o undefined si no se envió.
 */
function validarFiltroZona(query = {}) {
  if (query.zona_id === undefined) return undefined;
  const zonaId = Number(query.zona_id);
  if (!esEnteroPositivo(zonaId)) {
    throw new ApiError(400, 'zona_id debe ser un entero positivo.');
  }
  return zonaId;
}

module.exports = { validarCrear, validarActualizar, validarFiltroZona };
