'use strict';

const categoriaModel = require('../models/categoria.model');
const trazabilidad = require('../models/trazabilidad.model');
const ApiError = require('../utils/apiError');

const UNIQUE_VIOLATION = '23505';

async function listar() {
  return categoriaModel.listar();
}

async function obtener(id) {
  const categoria = await categoriaModel.buscarPorId(id);
  if (!categoria) throw new ApiError(404, 'Categoría no encontrada.');
  return categoria;
}

async function crear(datos, actorId) {
  let categoria;
  try {
    categoria = await categoriaModel.crear(datos);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw new ApiError(409, 'Ya existe una categoría con ese nombre.');
    throw err;
  }
  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'crear', entidad: 'categorias', entidadId: categoria.id,
    detalle: `Creó la categoría "${categoria.nombre}"`,
  });
  return categoria;
}

async function actualizar(id, cambios, actorId) {
  await obtener(id);
  let categoria;
  try {
    categoria = await categoriaModel.actualizar(id, cambios);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw new ApiError(409, 'Ya existe una categoría con ese nombre.');
    throw err;
  }
  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'modificar', entidad: 'categorias', entidadId: id,
    detalle: `Modificó la categoría "${categoria.nombre}"`,
  });
  return categoria;
}

module.exports = { listar, obtener, crear, actualizar };
