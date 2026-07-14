'use strict';

const { withTransaction } = require('../config/db');
const ventaModel = require('../models/venta.model');
const pagoModel = require('../models/pago.model');
const detalleModel = require('../models/comandaDetalle.model');
const comandaModel = require('../models/comanda.model');
const mesaModel = require('../models/mesa.model');
const comandaService = require('./comanda.service');
const trazabilidad = require('../models/trazabilidad.model');
const ApiError = require('../utils/apiError');

const UNIQUE_VIOLATION = '23505';

async function obtener(id) {
  const venta = await ventaModel.buscarPorId(id);
  if (!venta) throw new ApiError(404, 'Venta no encontrada.');
  const pagos = await pagoModel.listarPorVenta(id);
  const items = await detalleModel.listarPorComanda(venta.comanda_id);
  return { ...venta, pagos, items };
}

// Página de ventas del lado del servidor (cada página consulta solo su porción).
async function listar({ mes = null, page = 1, pageSize = 20 } = {}) {
  const limit = pageSize;
  const offset = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    ventaModel.listar({ mes, limit, offset }),
    ventaModel.contar({ mes }),
  ]);
  return { data, total, page, pageSize };
}

/**
 * Registra la venta y el pago de una comanda entregada (RF_19, RF_20, RF_21).
 * Los montos de la venta se calculan en el servidor a partir de la comanda.
 */
async function crear(datos, actorId) {
  const comanda = await comandaModel.buscarPorId(datos.comandaId);
  if (!comanda) throw new ApiError(404, 'Comanda no encontrada.');
  if (comanda.estado !== 'entregada') {
    throw new ApiError(409, 'Solo se puede cobrar una comanda entregada.');
  }

  // Totales calculados desde la comanda (no se confía en el cliente).
  const { resumen } = await comandaService.obtener(datos.comandaId);
  const propina = datos.propina || 0;
  const montoAPagar = resumen.total + propina;
  const sumaPagos = datos.pagos.reduce((suma, p) => suma + p.monto, 0);
  if (sumaPagos !== montoAPagar) {
    throw new ApiError(
      400,
      `El total de los pagos (${sumaPagos}) no coincide con el monto a pagar (${montoAPagar}).`
    );
  }

  let venta;
  try {
    venta = await withTransaction(async (client) => {
      const exec = (t, p) => client.query(t, p);
      const v = await ventaModel.crear(
        {
          comandaId: datos.comandaId,
          usuarioId: actorId,
          subtotal: resumen.subtotal,
          descuentoTotal: resumen.descuento_tipo_cliente,
          propina,
          total: resumen.total,
        },
        exec
      );
      for (const pago of datos.pagos) {
        await pagoModel.crear({ ventaId: v.id, tipoPago: pago.tipoPago, monto: pago.monto }, exec);
      }
      await comandaModel.cambiarEstado(datos.comandaId, 'pagada', exec);
      await mesaModel.cambiarEstado(comanda.mesa_id, 'libre', exec);
      return v;
    });
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw new ApiError(409, 'La comanda ya fue cobrada.');
    throw err;
  }

  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'registrar', entidad: 'ventas', entidadId: venta.id,
    detalle: `Registró la venta de la comanda #${datos.comandaId} (total ${venta.total}, propina ${propina})`,
  });
  return obtener(venta.id);
}

module.exports = { obtener, listar, crear };
