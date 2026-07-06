'use strict';

const avisoService = require('../services/avisoStock.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const ESTADOS = ['pendiente', 'resuelto'];

// GET /api/avisos-stock  (opcional ?estado=pendiente|resuelto)
const listar = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  if (estado !== undefined && !ESTADOS.includes(estado)) {
    throw new ApiError(400, `estado debe ser uno de: ${ESTADOS.join(', ')}.`);
  }
  res.json(await avisoService.listar(estado));
});

module.exports = { listar };
