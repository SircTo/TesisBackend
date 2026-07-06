'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/avisoStock.controller');

const router = Router();

// Los avisos de stock los consultan administrador y jefe de cocina (RF_18).
router.use(authenticate, authorize('administrador', 'jefe_cocina'));

router.get('/', ctrl.listar);

module.exports = router;
