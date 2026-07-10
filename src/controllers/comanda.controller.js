'use strict';

const comandaService = require('../services/comanda.service');
const {
  validarCrear,
  validarItem,
  validarActualizar,
  validarCambioEstado,
} = require('../validators/comanda.validator');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/comandas  (?estado= &mesa_id=)
const listar = asyncHandler(async (req, res) => {
  const filtros = {};
  if (req.query.estado) filtros.estado = req.query.estado;
  if (req.query.mesa_id) filtros.mesaId = Number(req.query.mesa_id);
  res.json(await comandaService.listar(filtros));
});

// GET /api/comandas/:id
const obtener = asyncHandler(async (req, res) => {
  res.json(await comandaService.obtener(Number(req.params.id)));
});

// POST /api/comandas
const crear = asyncHandler(async (req, res) => {
  const datos = validarCrear(req.body);
  const comanda = await comandaService.crear(datos, req.user.id);
  res.status(201).json(comanda);
});

// POST /api/comandas/:id/items
const agregarItem = asyncHandler(async (req, res) => {
  const datos = validarItem(req.body);
  const comanda = await comandaService.agregarItem(Number(req.params.id), datos, req.user.id);
  res.status(201).json(comanda);
});

// DELETE /api/comandas/:id/items/:itemId
const eliminarItem = asyncHandler(async (req, res) => {
  const comanda = await comandaService.eliminarItem(Number(req.params.id), Number(req.params.itemId), req.user.id);
  res.json(comanda);
});

// PUT /api/comandas/:id
const actualizar = asyncHandler(async (req, res) => {
  const cambios = validarActualizar(req.body);
  const comanda = await comandaService.actualizar(Number(req.params.id), cambios, req.user.id);
  res.json(comanda);
});

// PATCH /api/comandas/:id/estado
const cambiarEstado = asyncHandler(async (req, res) => {
  const estado = validarCambioEstado(req.body);
  const comanda = await comandaService.cambiarEstado(Number(req.params.id), estado, req.user.id);
  res.json(comanda);
});

// POST /api/comandas/:id/anular
const anular = asyncHandler(async (req, res) => {
  const comanda = await comandaService.anular(Number(req.params.id), req.user.id);
  res.json(comanda);
});

// POST /api/comandas/:id/solicitar-cuenta
const solicitarCuenta = asyncHandler(async (req, res) => {
  const comanda = await comandaService.solicitarCuenta(Number(req.params.id), req.user.id);
  res.json(comanda);
});

module.exports = { listar, obtener, crear, agregarItem, eliminarItem, actualizar, cambiarEstado, anular, solicitarCuenta };
