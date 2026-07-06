'use strict';

const { query } = require('../config/db');

const CAMPOS = 'id, producto_id, stock_al_generar, estado, created_at, resuelto_at';

async function buscarPendiente(productoId) {
  const { rows } = await query(
    `SELECT ${CAMPOS} FROM avisos_stock WHERE producto_id = $1 AND estado = 'pendiente'`,
    [productoId]
  );
  return rows[0] || null;
}

async function crear({ productoId, stockAlGenerar }) {
  const { rows } = await query(
    `INSERT INTO avisos_stock (producto_id, stock_al_generar)
     VALUES ($1, $2)
     RETURNING ${CAMPOS}`,
    [productoId, stockAlGenerar]
  );
  return rows[0];
}

async function resolver(productoId) {
  await query(
    `UPDATE avisos_stock SET estado = 'resuelto', resuelto_at = now()
     WHERE producto_id = $1 AND estado = 'pendiente'`,
    [productoId]
  );
}

async function listar(estado) {
  if (estado) {
    const { rows } = await query(
      `SELECT ${CAMPOS} FROM avisos_stock WHERE estado = $1 ORDER BY id DESC`,
      [estado]
    );
    return rows;
  }
  const { rows } = await query(`SELECT ${CAMPOS} FROM avisos_stock ORDER BY id DESC`);
  return rows;
}

module.exports = { buscarPendiente, crear, resolver, listar };
