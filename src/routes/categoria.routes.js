'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/categoria.controller');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', authorize('administrador'), ctrl.crear);
router.put('/:id', authorize('administrador'), ctrl.actualizar);

module.exports = router;
