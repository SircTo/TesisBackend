'use strict';

const mesaModel = require('../models/mesa.model');
const zonaModel = require('../models/zona.model');
const trazabilidad = require('../models/trazabilidad.model');
const ApiError = require('../utils/apiError');

// Código de PostgreSQL para violación de restricción única.
const UNIQUE_VIOLATION = '23505';

async function asegurarZonaExiste(zonaId) {
  const zona = await zonaModel.buscarPorId(zonaId);
  if (!zona) throw new ApiError(404, 'La zona indicada no existe.');
}

async function listar(zonaId) {
  return mesaModel.listar(zonaId);
}

async function obtener(id) {
  const mesa = await mesaModel.buscarPorId(id);
  if (!mesa) throw new ApiError(404, 'Mesa no encontrada.');
  return mesa;
}

async function crear(datos, actorId) {
  await asegurarZonaExiste(datos.zonaId);
  let mesa;
  try {
    mesa = await mesaModel.crear(datos);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      throw new ApiError(409, 'Ya existe una mesa con ese número en la zona.');
    }
    throw err;
  }
  await trazabilidad.registrar({
    usuarioId: actorId,
    accion: 'crear',
    entidad: 'mesas',
    entidadId: mesa.id,
    detalle: `Creó la mesa ${mesa.numero} en la zona ${mesa.zona_id}`,
  });
  return mesa;
}

async function actualizar(id, cambios, actorId) {
  await obtener(id); // 404 si no existe
  if (cambios.zonaId !== undefined) await asegurarZonaExiste(cambios.zonaId);

  let mesa;
  try {
    mesa = await mesaModel.actualizar(id, cambios);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      throw new ApiError(409, 'Ya existe una mesa con ese número en la zona.');
    }
    throw err;
  }
  await trazabilidad.registrar({
    usuarioId: actorId,
    accion: 'modificar',
    entidad: 'mesas',
    entidadId: id,
    detalle: `Modificó la mesa ${mesa.numero} (zona ${mesa.zona_id})`,
  });
  return mesa;
}

module.exports = { listar, obtener, crear, actualizar };
