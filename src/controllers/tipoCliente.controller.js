'use strict';

const tipoClienteService = require('../services/tipoCliente.service');
const { validarCrear, validarActualizar } = require('../validators/tipoCliente.validator');
const asyncHandler = require('../utils/asyncHandler');

const listar = asyncHandler(async (req, res) => {
  res.json(await tipoClienteService.listar());
});

const obtener = asyncHandler(async (req, res) => {
  res.json(await tipoClienteService.obtener(Number(req.params.id)));
});

const crear = asyncHandler(async (req, res) => {
  const datos = validarCrear(req.body);
  const tipo = await tipoClienteService.crear(datos, req.user.id);
  res.status(201).json(tipo);
});

const actualizar = asyncHandler(async (req, res) => {
  const cambios = validarActualizar(req.body);
  const tipo = await tipoClienteService.actualizar(Number(req.params.id), cambios, req.user.id);
  res.json(tipo);
});

module.exports = { listar, obtener, crear, actualizar };
