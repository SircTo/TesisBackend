'use strict';

const { query } = require('../config/db');

const CAMPOS =
  'id, nombre, categoria_id, precio, stock, stock_minimo, disponibilidad, area, estado, created_at';

/**
 * Lista productos con filtros opcionales (categoriaId, area, disponibilidad, estado).
 */
async function listar(filtros = {}) {
  const cond = [];
  const params = [];
  if (filtros.categoriaId) {
    params.push(filtros.categoriaId);
    cond.push(`categoria_id = $${params.length}`);
  }
  if (filtros.area) {
    params.push(filtros.area);
    cond.push(`area = $${params.length}`);
  }
  if (filtros.disponibilidad !== undefined) {
    params.push(filtros.disponibilidad);
    cond.push(`disponibilidad = $${params.length}`);
  }
  if (filtros.estado) {
    params.push(filtros.estado);
    cond.push(`estado = $${params.length}`);
  }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
  const { rows } = await query(`SELECT ${CAMPOS} FROM productos ${where} ORDER BY id`, params);
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await query(`SELECT ${CAMPOS} FROM productos WHERE id = $1`, [id]);
  return rows[0] || null;
}

// exec permite ejecutar dentro de una transacción (recibe client.query).
async function crear({ nombre, categoriaId, precio, stock, stockMinimo, disponibilidad, area }, exec = query) {
  const { rows } = await exec(
    `INSERT INTO productos (nombre, categoria_id, precio, stock, stock_minimo, disponibilidad, area)
     VALUES ($1, $2, $3, COALESCE($4, 0), COALESCE($5, 0), COALESCE($6, true), $7)
     RETURNING ${CAMPOS}`,
    [nombre, categoriaId || null, precio, stock ?? null, stockMinimo ?? null, disponibilidad ?? null, area]
  );
  return rows[0];
}

// Actualiza datos del producto SIN tocar el stock (el stock se ajusta aparte, RF_17).
async function actualizar(id, { nombre, categoriaId, precio, stockMinimo, disponibilidad, area, estado }) {
  const { rows } = await query(
    `UPDATE productos SET
       nombre         = COALESCE($2, nombre),
       categoria_id   = COALESCE($3, categoria_id),
       precio         = COALESCE($4, precio),
       stock_minimo   = COALESCE($5, stock_minimo),
       disponibilidad = COALESCE($6, disponibilidad),
       area           = COALESCE($7, area),
       estado         = COALESCE($8, estado)
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [id, nombre || null, categoriaId || null, precio ?? null, stockMinimo ?? null, disponibilidad ?? null, area || null, estado || null]
  );
  return rows[0] || null;
}

/**
 * Aplica un delta al stock de forma atómica. Devuelve el producto actualizado,
 * o null si el ajuste dejaría el stock en negativo (o el producto no existe).
 */
async function ajustarStock(id, delta, exec = query) {
  const { rows } = await exec(
    `UPDATE productos SET stock = stock + $2
     WHERE id = $1 AND stock + $2 >= 0
     RETURNING ${CAMPOS}`,
    [id, delta]
  );
  return rows[0] || null;
}

module.exports = { listar, buscarPorId, crear, actualizar, ajustarStock };
