'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const ctrl = require('../controllers/comanda.controller');

const router = Router();

router.use(authenticate);

// Lectura: cualquier usuario autenticado.
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);

// Operación de la comanda: garzón y administrador (RF_07, RF_09).
router.post('/', authorize('garzon', 'administrador'), ctrl.crear);
router.patch('/:id/estado', authorize('garzon', 'administrador'), ctrl.cambiarEstado);
router.delete('/:id/items/:itemId', authorize('garzon', 'administrador'), ctrl.eliminarItem);

// Agregar productos: garzón, jefe de cocina y administrador
// (jefe de cocina/admin pueden aplicar descuentos por producto, RF_15).
router.post('/:id/items', authorize('garzon', 'jefe_cocina', 'administrador'), ctrl.agregarItem);

// Solo administrador: editar (RF_12) y anular (RF_13).
router.put('/:id', authorize('administrador'), ctrl.actualizar);
router.post('/:id/anular', authorize('administrador'), ctrl.anular);

module.exports = router;
