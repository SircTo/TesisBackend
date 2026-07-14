'use strict';

// Los reportes son de solo lectura: el servicio delega en el modelo de consultas.
const reporteModel = require('../models/reporte.model');

// Envuelve los reportes paginados como { data, total, page, pageSize }.
async function paginado(fn, filtros) {
  const { data, total } = await fn(filtros);
  return { data, total, page: filtros.page, pageSize: filtros.pageSize };
}

module.exports = {
  ventas: (filtros) => paginado(reporteModel.ventas, filtros),
  productosMasVendidos: (filtros) => reporteModel.productosMasVendidos(filtros),
  ingresos: (filtros) => reporteModel.ingresos(filtros),
  stockActual: (filtros) => paginado(reporteModel.stockActual, filtros),
  movimientos: (filtros) => paginado(reporteModel.movimientos, filtros),
};
