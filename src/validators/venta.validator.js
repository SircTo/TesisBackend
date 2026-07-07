'use strict';

const ApiError = require('../utils/apiError');

const TIPOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];
const esEnteroPositivo = (v) => Number.isInteger(v) && v > 0;
const esEnteroNoNegativo = (v) => Number.isInteger(v) && v >= 0;

function validarCrear(body = {}) {
  if (!esEnteroPositivo(body.comanda_id)) {
    throw new ApiError(400, 'comanda_id debe ser un entero positivo.');
  }
  if (body.propina !== undefined && !esEnteroNoNegativo(body.propina)) {
    throw new ApiError(400, 'La propina debe ser un entero mayor o igual a 0.');
  }
  if (!Array.isArray(body.pagos) || body.pagos.length === 0) {
    throw new ApiError(400, 'Debe incluir al menos un pago.');
  }
  const pagos = body.pagos.map((p, i) => {
    if (!p || typeof p !== 'object') throw new ApiError(400, `El pago ${i + 1} es inválido.`);
    if (!TIPOS_PAGO.includes(p.tipo_pago)) {
      throw new ApiError(400, `tipo_pago debe ser uno de: ${TIPOS_PAGO.join(', ')}.`);
    }
    if (!esEnteroPositivo(p.monto)) {
      throw new ApiError(400, `El monto del pago ${i + 1} debe ser un entero positivo.`);
    }
    return { tipoPago: p.tipo_pago, monto: p.monto };
  });
  return { comandaId: body.comanda_id, propina: body.propina, pagos };
}

module.exports = { validarCrear };
