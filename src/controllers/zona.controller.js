'use strict';

const zonaService = require('../services/zona.service');
const { validarCrear, validarActualizar } = require('../validators/zona.validator');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/zonas
const listar = asyncHandler(async (req, res) => {
  res.json(await zonaService.listar());
});

// GET /api/zonas/:id
const obtener = asyncHandler(async (req, res) => {
  res.json(await zonaService.obtener(Number(req.params.id)));
});

// POST /api/zonas
const crear = asyncHandler(async (req, res) => {
  const datos = validarCrear(req.body);
  const zona = await zonaService.crear(datos, req.user.id);
  res.status(201).json(zona);
});

// PUT /api/zonas/:id
const actualizar = asyncHandler(async (req, res) => {
  const cambios = validarActualizar(req.body);
  const zona = await zonaService.actualizar(Number(req.params.id), cambios, req.user.id);
  res.json(zona);
});

module.exports = { listar, obtener, crear, actualizar };
