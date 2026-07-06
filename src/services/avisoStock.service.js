'use strict';

const avisoModel = require('../models/avisoStock.model');

/**
 * Evalúa el estado de aviso de stock de un producto:
 * - Si el stock quedó en el mínimo o por debajo y no hay aviso pendiente, crea uno.
 * - Si el stock volvió por encima del mínimo y había un aviso pendiente, lo resuelve.
 * Es best-effort: un fallo aquí se loguea pero no interrumpe la operación de stock.
 */
async function evaluar(producto) {
  try {
    const bajoMinimo = producto.stock <= producto.stock_minimo;
    const pendiente = await avisoModel.buscarPendiente(producto.id);

    if (bajoMinimo && !pendiente) {
      await avisoModel.crear({ productoId: producto.id, stockAlGenerar: producto.stock });
    } else if (!bajoMinimo && pendiente) {
      await avisoModel.resolver(producto.id);
    }
  } catch (err) {
    console.warn(
      `[avisos] No se pudo evaluar el aviso de stock del producto ${producto.id}: ${err.message}`
    );
  }
}

async function listar(estado) {
  return avisoModel.listar(estado);
}

module.exports = { evaluar, listar };
