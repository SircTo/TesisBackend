'use strict';

const usuarioModel = require('../models/usuario.model');
const trazabilidad = require('../models/trazabilidad.model');
const { hashPassword } = require('../utils/password');
const ApiError = require('../utils/apiError');

// Código de PostgreSQL para violación de restricción única.
const UNIQUE_VIOLATION = '23505';

/**
 * Registra un nuevo usuario (RF_02). Solo el administrador debería llegar aquí
 * (lo controla el middleware de la ruta). actorId es quien realiza la acción.
 */
async function crear(datos, actorId) {
  const existente = await usuarioModel.buscarPorCorreo(datos.correo);
  if (existente) throw new ApiError(409, 'Ya existe un usuario con ese correo.');

  const passwordHash = await hashPassword(datos.password);
  let usuario;
  try {
    usuario = await usuarioModel.crear({
      nombre: datos.nombre,
      correo: datos.correo,
      passwordHash,
      rol: datos.rol,
      estado: datos.estado,
    });
  } catch (err) {
    // Respaldo ante condición de carrera (dos altas simultáneas con el mismo correo).
    if (err.code === UNIQUE_VIOLATION) throw new ApiError(409, 'Ya existe un usuario con ese correo.');
    throw err;
  }

  await trazabilidad.registrar({
    usuarioId: actorId,
    accion: 'crear',
    entidad: 'usuarios',
    entidadId: usuario.id,
    detalle: `Creó al usuario ${usuario.correo} (${usuario.rol})`,
  });
  return usuario;
}

async function listar() {
  return usuarioModel.listar();
}

async function obtener(id) {
  const usuario = await usuarioModel.buscarPorId(id);
  if (!usuario) throw new ApiError(404, 'Usuario no encontrado.');
  return usuario;
}

async function actualizar(id, datos, actorId) {
  await obtener(id); // lanza 404 si no existe

  // Un usuario no puede desactivar su propia cuenta (evita autobloqueo del admin).
  if (id === actorId && datos.estado === 'inactivo') {
    throw new ApiError(409, 'No puedes desactivar tu propia cuenta.');
  }

  const cambios = { nombre: datos.nombre, rol: datos.rol, estado: datos.estado };
  if (datos.password) cambios.passwordHash = await hashPassword(datos.password);

  const usuario = await usuarioModel.actualizar(id, cambios);
  await trazabilidad.registrar({
    usuarioId: actorId,
    accion: 'modificar',
    entidad: 'usuarios',
    entidadId: id,
    detalle: `Modificó al usuario ${usuario.correo}`,
  });
  return usuario;
}

module.exports = { crear, listar, obtener, actualizar };
