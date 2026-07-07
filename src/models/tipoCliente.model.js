'use strict';

const { query } = require('../config/db');

const CAMPOS = 'id, nombre, porcentaje_descuento, estado';

async function listar() {
  const { rows } = await query(`SELECT ${CAMPOS} FROM tipos_cliente ORDER BY nombre`);
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await query(`SELECT ${CAMPOS} FROM tipos_cliente WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function crear({ nombre, porcentajeDescuento, estado }) {
  const { rows } = await query(
    `INSERT INTO tipos_cliente (nombre, porcentaje_descuento, estado)
     VALUES ($1, COALESCE($2, 0), COALESCE($3, 'activo'))
     RETURNING ${CAMPOS}`,
    [nombre, porcentajeDescuento ?? null, estado || null]
  );
  return rows[0];
}

async function actualizar(id, { nombre, porcentajeDescuento, estado }) {
  const { rows } = await query(
    `UPDATE tipos_cliente SET
       nombre               = COALESCE($2, nombre),
       porcentaje_descuento = COALESCE($3, porcentaje_descuento),
       estado               = COALESCE($4, estado)
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [id, nombre || null, porcentajeDescuento ?? null, estado || null]
  );
  return rows[0] || null;
}

module.exports = { listar, buscarPorId, crear, actualizar };
