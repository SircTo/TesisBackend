'use strict';

// Los reportes son de solo lectura: el servicio delega en el modelo de consultas.
const reporteModel = require('../models/reporte.model');

module.exports = {
  ventas: (filtros) => reporteModel.ventas(filtros),
  productosMasVendidos: (filtros) => reporteModel.productosMasVendidos(filtros),
  ingresos: (filtros) => reporteModel.ingresos(filtros),
  stockActual: (filtros) => reporteModel.stockActual(filtros),
  movimientos: (filtros) => reporteModel.movimientos(filtros),
};
