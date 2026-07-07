'use strict';

const reporteService = require('../services/reporte.service');
const V = require('../validators/reporte.validator');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/reportes/ventas
const ventas = asyncHandler(async (req, res) => {
  res.json(await reporteService.ventas(V.validarFiltrosVentas(req.query)));
});

// GET /api/reportes/productos-mas-vendidos
const productosMasVendidos = asyncHandler(async (req, res) => {
  res.json(await reporteService.productosMasVendidos(V.validarRango(req.query)));
});

// GET /api/reportes/ingresos
const ingresos = asyncHandler(async (req, res) => {
  res.json(await reporteService.ingresos(V.validarRango(req.query)));
});

// GET /api/reportes/stock
const stock = asyncHandler(async (req, res) => {
  res.json(await reporteService.stockActual(V.validarFiltrosStock(req.query)));
});

// GET /api/reportes/movimientos
const movimientos = asyncHandler(async (req, res) => {
  res.json(await reporteService.movimientos(V.validarFiltrosMovimientos(req.query)));
});

module.exports = { ventas, productosMasVendidos, ingresos, stock, movimientos };
