'use strict';

const zonaModel = require('../models/zona.model');
const trazabilidad = require('../models/trazabilidad.model');
const ApiError = require('../utils/apiError');

async function listar() {
  return zonaModel.listar();
}

async function obtener(id) {
  const zona = await zonaModel.buscarPorId(id);
  if (!zona) throw new ApiError(404, 'Zona no encontrada.');
  return zona;
}

async function crear(datos, actorId) {
  const zona = await zonaModel.crear(datos);
  await trazabilidad.registrar({
    usuarioId: actorId,
    accion: 'crear',
    entidad: 'zonas',
    entidadId: zona.id,
    detalle: `Creó la zona "${zona.nombre}"`,
  });
  return zona;
}

async function actualizar(id, cambios, actorId) {
  await obtener(id); // 404 si no existe
  const zona = await zonaModel.actualizar(id, cambios);
  await trazabilidad.registrar({
    usuarioId: actorId,
    accion: 'modificar',
    entidad: 'zonas',
    entidadId: id,
    detalle: `Modificó la zona "${zona.nombre}"`,
  });
  return zona;
}

module.exports = { listar, obtener, crear, actualizar };
