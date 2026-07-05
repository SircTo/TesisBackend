'use strict';

const authService = require('../services/auth.service');
const { validarLogin } = require('../validators/usuario.validator');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { correo, password } = validarLogin(req.body);
  const resultado = await authService.login(correo, password);
  res.json(resultado);
});

module.exports = { login };
