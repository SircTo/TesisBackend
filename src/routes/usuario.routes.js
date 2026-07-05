'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/usuario.controller');

const router = Router();

// La gestión de usuarios es exclusiva del administrador (RF_02).
router.use(authenticate, authorize('administrador'));

router.post('/', ctrl.crear);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.put('/:id', ctrl.actualizar);

module.exports = router;
