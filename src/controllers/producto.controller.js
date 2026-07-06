'use strict';

const productoService = require('../services/producto.service');
const {
  validarCrear,
  validarActualizar,
  validarAjusteStock,
  validarFiltros,
} = require('../validators/producto.validator');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/productos  (filtros: ?categoria_id= &area= &disponibilidad= &estado=)
const listar = asyncHandler(async (req, res) => {
  const filtros = validarFiltros(req.query);
  res.json(await productoService.listar(filtros));
});

// GET /api/productos/:id
const obtener = asyncHandler(async (req, res) => {
  res.json(await productoService.obtener(Number(req.params.id)));
});

// POST /api/productos
const crear = asyncHandler(async (req, res) => {
  const datos = validarCrear(req.body);
  const producto = await productoService.crear(datos, req.user.id);
  res.status(201).json(producto);
});

// PUT /api/productos/:id  (no modifica el stock)
const actualizar = asyncHandler(async (req, res) => {
  const cambios = validarActualizar(req.body);
  const producto = await productoService.actualizar(Number(req.params.id), cambios, req.user.id);
  res.json(producto);
});

// POST /api/productos/:id/stock  (ajuste de stock, RF_17)
const ajustarStock = asyncHandler(async (req, res) => {
  const datos = validarAjusteStock(req.body);
  const producto = await productoService.ajustarStock(Number(req.params.id), datos, req.user.id);
  res.json(producto);
});

// GET /api/productos/:id/movimientos
const historialStock = asyncHandler(async (req, res) => {
  res.json(await productoService.historialStock(Number(req.params.id)));
});

module.exports = { listar, obtener, crear, actualizar, ajustarStock, historialStock };
