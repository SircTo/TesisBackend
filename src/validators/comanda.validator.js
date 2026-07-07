'use strict';

const ApiError = require('../utils/apiError');

const esEnteroPositivo = (v) => Number.isInteger(v) && v > 0;
const esPorcentaje = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
const ESTADOS_DESTINO = ['en_preparacion', 'entregada'];

function validarCrear(body = {}) {
  if (!esEnteroPositivo(body.mesa_id)) throw new ApiError(400, 'mesa_id debe ser un entero positivo.');
  if (body.tipo_cliente_id !== undefined && body.tipo_cliente_id !== null && !esEnteroPositivo(body.tipo_cliente_id)) {
    throw new ApiError(400, 'tipo_cliente_id debe ser un entero positivo.');
  }
  const observaciones = typeof body.observaciones === 'string' ? body.observaciones.trim() : undefined;
  return { mesaId: body.mesa_id, tipoClienteId: body.tipo_cliente_id ?? undefined, observaciones };
}

function validarItem(body = {}) {
  if (!esEnteroPositivo(body.producto_id)) throw new ApiError(400, 'producto_id debe ser un entero positivo.');
  if (!esEnteroPositivo(body.cantidad)) throw new ApiError(400, 'cantidad debe ser un entero positivo.');
  if (body.descuento_porcentaje !== undefined && !esPorcentaje(body.descuento_porcentaje)) {
    throw new ApiError(400, 'descuento_porcentaje debe ser un número entre 0 y 100.');
  }
  const observaciones = typeof body.observaciones === 'string' ? body.observaciones.trim() : undefined;
  return {
    productoId: body.producto_id,
    cantidad: body.cantidad,
    descuentoPorcentaje: body.descuento_porcentaje,
    observaciones,
  };
}

function validarActualizar(body = {}) {
  const cambios = {};
  if (body.tipo_cliente_id !== undefined) {
    if (body.tipo_cliente_id !== null && !esEnteroPositivo(body.tipo_cliente_id)) {
      throw new ApiError(400, 'tipo_cliente_id debe ser un entero positivo o null.');
    }
    cambios.tipoClienteId = body.tipo_cliente_id; // null permitido para quitar el tipo de cliente
  }
  if (body.observaciones !== undefined) {
    cambios.observaciones = typeof body.observaciones === 'string' ? body.observaciones.trim() : '';
  }
  if (Object.keys(cambios).length === 0) throw new ApiError(400, 'No se enviaron cambios para actualizar.');
  return cambios;
}

function validarCambioEstado(body = {}) {
  if (!ESTADOS_DESTINO.includes(body.estado)) {
    throw new ApiError(400, `estado debe ser uno de: ${ESTADOS_DESTINO.join(', ')}.`);
  }
  return body.estado;
}

module.exports = { validarCrear, validarItem, validarActualizar, validarCambioEstado };
