'use strict';

const usuarioService = require('../services/usuario.service');
const { validarCrear, validarActualizar } = require('../validators/usuario.validator');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/usuarios
const crear = asyncHandler(async (req, res) => {
  const datos = validarCrear(req.body);
  const usuario = await usuarioService.crear(datos, req.user.id);
  res.status(201).json(usuario);
});

// GET /api/usuarios
const listar = asyncHandler(async (req, res) => {
  const usuarios = await usuarioService.listar();
  res.json(usuarios);
});

// GET /api/usuarios/:id
const obtener = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.obtener(Number(req.params.id));
  res.json(usuario);
});

// PUT /api/usuarios/:id
const actualizar = asyncHandler(async (req, res) => {
  const cambios = validarActualizar(req.body);
  const usuario = await usuarioService.actualizar(Number(req.params.id), cambios, req.user.id);
  res.json(usuario);
});

module.exports = { crear, listar, obtener, actualizar };
