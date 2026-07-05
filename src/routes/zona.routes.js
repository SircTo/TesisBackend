'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/zona.controller');

const router = Router();

// Requiere sesión. La lectura la puede hacer cualquier usuario autenticado;
// crear y modificar es exclusivo del administrador (RF_03).
router.use(authenticate);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', authorize('administrador'), ctrl.crear);
router.put('/:id', authorize('administrador'), ctrl.actualizar);

module.exports = router;
