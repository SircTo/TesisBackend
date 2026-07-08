'use strict';

const { query } = require('../config/db');

// Columnas que se devuelven al exterior (nunca el password_hash).
const CAMPOS_PUBLICOS = 'id, nombre, correo, rol, estado, created_at';

/**
 * Busca un usuario por correo. Incluye password_hash porque se usa en el login.
 */
async function buscarPorCorreo(correo) {
  const { rows } = await query(
    'SELECT id, nombre, correo, password_hash, rol, estado FROM usuarios WHERE correo = $1',
    [correo]
  );
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function listar() {
  const { rows } = await query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios ORDER BY id`);
  return rows;
}

async function crear({ nombre, correo, passwordHash, rol, estado }) {
  const { rows } = await query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol, estado)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'activo'))
     RETURNING ${CAMPOS_PUBLICOS}`,
    [nombre, correo, passwordHash, rol, estado || null]
  );
  return rows[0];
}

/**
 * Actualiza solo los campos entregados (los demás quedan igual gracias a COALESCE).
 */
async function actualizar(id, { nombre, rol, estado, passwordHash }) {
  const { rows } = await query(
    `UPDATE usuarios SET
       nombre        = COALESCE($2, nombre),
       rol           = COALESCE($3, rol),
       estado        = COALESCE($4, estado),
       password_hash = COALESCE($5, password_hash)
     WHERE id = $1
     RETURNING ${CAMPOS_PUBLICOS}`,
    [id, nombre || null, rol || null, estado || null, passwordHash || null]
  );
  return rows[0] || null;
}

async function contarAdministradoresActivos() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM usuarios WHERE rol = 'administrador' AND estado = 'activo'`
  );
  return rows[0].total;
}

module.exports = { buscarPorCorreo, buscarPorId, listar, crear, actualizar, contarAdministradoresActivos };
