'use strict';

const { query } = require('../config/db');

const CAMPOS = 'id, nombre, estado';

async function listar() {
  const { rows } = await query(`SELECT ${CAMPOS} FROM categorias ORDER BY nombre`);
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await query(`SELECT ${CAMPOS} FROM categorias WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function crear({ nombre, estado }) {
  const { rows } = await query(
    `INSERT INTO categorias (nombre, estado)
     VALUES ($1, COALESCE($2, 'activo'))
     RETURNING ${CAMPOS}`,
    [nombre, estado || null]
  );
  return rows[0];
}

async function actualizar(id, { nombre, estado }) {
  const { rows } = await query(
    `UPDATE categorias SET
       nombre = COALESCE($2, nombre),
       estado = COALESCE($3, estado)
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [id, nombre || null, estado || null]
  );
  return rows[0] || null;
}

module.exports = { listar, buscarPorId, crear, actualizar };
