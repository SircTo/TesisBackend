'use strict';

const tipoClienteModel = require('../models/tipoCliente.model');
const trazabilidad = require('../models/trazabilidad.model');
const ApiError = require('../utils/apiError');

const UNIQUE_VIOLATION = '23505';

async function listar() {
  return tipoClienteModel.listar();
}

async function obtener(id) {
  const tipo = await tipoClienteModel.buscarPorId(id);
  if (!tipo) throw new ApiError(404, 'Tipo de cliente no encontrado.');
  return tipo;
}

async function crear(datos, actorId) {
  let tipo;
  try {
    tipo = await tipoClienteModel.crear(datos);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw new ApiError(409, 'Ya existe un tipo de cliente con ese nombre.');
    throw err;
  }
  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'crear', entidad: 'tipos_cliente', entidadId: tipo.id,
    detalle: `Creó el tipo de cliente "${tipo.nombre}" (${tipo.porcentaje_descuento}%)`,
  });
  return tipo;
}

async function actualizar(id, cambios, actorId) {
  await obtener(id);
  let tipo;
  try {
    tipo = await tipoClienteModel.actualizar(id, cambios);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw new ApiError(409, 'Ya existe un tipo de cliente con ese nombre.');
    throw err;
  }
  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'modificar', entidad: 'tipos_cliente', entidadId: id,
    detalle: `Modificó el tipo de cliente "${tipo.nombre}"`,
  });
  return tipo;
}

module.exports = { listar, obtener, crear, actualizar };
