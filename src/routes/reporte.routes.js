'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/reporte.controller');

const router = Router();

// Todos los reportes son exclusivos del administrador (RF_22, RF_23).
router.use(authenticate, authorize('administrador'));

router.get('/ventas', ctrl.ventas);
router.get('/productos-mas-vendidos', ctrl.productosMasVendidos);
router.get('/ingresos', ctrl.ingresos);
router.get('/stock', ctrl.stock);
router.get('/movimientos', ctrl.movimientos);

module.exports = router;
