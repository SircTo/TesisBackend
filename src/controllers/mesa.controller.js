'use strict';

const mesaService = require('../services/mesa.service');
const { validarCrear, validarActualizar, validarFiltroZona } = require('../validators/mesa.validator');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/mesas  (opcional ?zona_id=)
const listar = asyncHandler(async (req, res) => {
  const zonaId = validarFiltroZona(req.query);
  res.json(await mesaService.listar(zonaId));
});

// GET /api/mesas/:id
const obtener = asyncHandler(async (req, res) => {
  res.json(await mesaService.obtener(Number(req.params.id)));
});

// POST /api/mesas
const crear = asyncHandler(async (req, res) => {
  const datos = validarCrear(req.body);
  const mesa = await mesaService.crear(datos, req.user.id);
  res.status(201).json(mesa);
});

// PUT /api/mesas/:id
const actualizar = asyncHandler(async (req, res) => {
  const cambios = validarActualizar(req.body);
  const mesa = await mesaService.actualizar(Number(req.params.id), cambios, req.user.id);
  res.json(mesa);
});

module.exports = { listar, obtener, crear, actualizar };
