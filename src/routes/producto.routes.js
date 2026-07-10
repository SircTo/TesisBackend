'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/producto.controller');

const router = Router();

router.use(authenticate);

// Lectura: cualquier usuario autenticado.
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.get('/:id/movimientos', ctrl.historialStock);

// Gestión de productos: jefe de cocina y administrador (RF_05, RF_06).
router.post('/', authorize('jefe_cocina', 'administrador'), ctrl.crear);
router.put('/:id', authorize('jefe_cocina', 'administrador'), ctrl.actualizar);

// Ajuste de stock: jefe de cocina y administrador (RF_17).
router.post('/:id/stock', authorize('jefe_cocina', 'administrador'), ctrl.ajustarStock);

// Revisión de inventario (corrección por lotes): jefe de cocina y administrador.
router.post('/revision', authorize('jefe_cocina', 'administrador'), ctrl.revisar);

module.exports = router;
