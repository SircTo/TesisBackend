'use strict';

const ventaService = require('../services/venta.service');
const { validarCrear } = require('../validators/venta.validator');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/ventas
const listar = asyncHandler(async (req, res) => {
  res.json(await ventaService.listar());
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
