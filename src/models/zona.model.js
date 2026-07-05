'use strict';

const { query } = require('../config/db');

const CAMPOS = 'id, nombre, descripcion, estado';

async function listar() {
  const { rows } = await query(`SELECT ${CAMPOS} FROM zonas ORDER BY id`);
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await query(`SELECT ${CAMPOS} FROM zonas WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function crear({ nombre, descripcion, estado }) {
  const { rows } = await query(
    `INSERT INTO zonas (nombre, descripcion, estado)
     VALUES ($1, $2, COALESCE($3, 'activo'))
     RETURNING ${CAMPOS}`,
    [nombre, descripcion || null, estado || null]
  );
  return rows[0];
}

async function actualizar(id, { nombre, descripcion, estado }) {
  const { rows } = await query(
    `UPDATE zonas SET
       nombre      = COALESCE($2, nombre),
       descripcion = COALESCE($3, descripcion),
       estado      = COALESCE($4, estado)
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [id, nombre || null, descripcion ?? null, estado || null]
  );
  return rows[0] || null;
}

module.exports = { listar, buscarPorId, crear, actualizar };
