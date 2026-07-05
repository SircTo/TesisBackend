'use strict';

const { Router } = require('express');

const router = Router();

// Healthcheck: permite verificar que la API está viva.
// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sjmr-backend' });
});

// A medida que se desarrollen los módulos, se montarán aquí. Ejemplo:
// router.use('/auth', require('./auth.routes'));
// router.use('/usuarios', require('./usuario.routes'));
// router.use('/comandas', require('./comanda.routes'));

module.exports = router;
