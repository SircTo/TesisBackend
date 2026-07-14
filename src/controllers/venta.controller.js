'use strict';

const ventaService = require('../services/venta.service');
const { validarCrear } = require('../validators/venta.validator');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/ventas?mes=YYYY-MM&page=1&pageSize=20
const listar = asyncHandler(async (req, res) => {
  const mes = /^\d{4}-\d{2}$/.test(req.query.mes) ? req.query.mes : null;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
  res.json(await ventaService.listar({ mes, page, pageSize }));
});

// GET /api/ventas/:id
const obtener = asyncHandler(async (req, res) => {
  res.json(await ventaService.obtener(Number(req.params.id)));
});

// POST /api/ventas
const crear = asyncHandler(async (req, res) => {
  const datos = validarCrear(req.body);
  const venta = await ventaService.crear(datos, req.user.id);
  res.status(201).json(venta);
});

module.exports = { listar, obtener, crear };
