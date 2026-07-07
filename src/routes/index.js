'use strict';

const { Router } = require('express');

const router = Router();

// Healthcheck: permite verificar que la API está viva.
// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sjmr-backend' });
});

// Módulos del sistema
router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuario.routes'));
router.use('/zonas', require('./zona.routes'));
router.use('/mesas', require('./mesa.routes'));
router.use('/categorias', require('./categoria.routes'));
router.use('/productos', require('./producto.routes'));
router.use('/avisos-stock', require('./avisoStock.routes'));
router.use('/tipos-cliente', require('./tipoCliente.routes'));
router.use('/comandas', require('./comanda.routes'));
router.use('/ventas', require('./venta.routes'));

module.exports = router;
