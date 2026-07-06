'use strict';

const categoriaService = require('../services/categoria.service');
const { validarCrear, validarActualizar } = require('../validators/categoria.validator');
const asyncHandler = require('../utils/asyncHandler');

const listar = asyncHandler(async (req, res) => {
  res.json(await categoriaService.listar());
});

const obtener = asyncHandler(async (req, res) => {
  res.json(await categoriaService.obtener(Number(req.params.id)));
});

const crear = asyncHandler(async (req, res) => {
  const datos = validarCrear(req.body);
  const categoria = await categoriaService.crear(datos, req.user.id);
  res.status(201).json(categoria);
});

const actualizar = asyncHandler(async (req, res) => {
  const cambios = validarActualizar(req.body);
  const categoria = await categoriaService.actualizar(Number(req.params.id), cambios, req.user.id);
  res.json(categoria);
});

module.exports = { listar, obtener, crear, actualizar };
