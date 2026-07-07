'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/tipoCliente.controller');

const router = Router();

router.use(authenticate);

// Lectura: cualquier usuario autenticado (el garzón los usa al aplicar descuentos).
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);

// Gestión de tipos de cliente y sus descuentos: administrador (RF_16).
router.post('/', authorize('administrador'), ctrl.crear);
router.put('/:id', authorize('administrador'), ctrl.actualizar);

module.exports = router;
