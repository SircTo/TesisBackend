'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/venta.controller');

const router = Router();

router.use(authenticate);

// Registrar el cobro de una comanda: garzón y administrador (RF_19).
router.post('/', authorize('garzon', 'administrador'), ctrl.crear);

// Consulta de ventas: administrador (dominio de reportes, RF_22).
router.get('/', authorize('administrador'), ctrl.listar);
router.get('/:id', authorize('administrador'), ctrl.obtener);

module.exports = router;
