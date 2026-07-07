'use strict';

const { query } = require('../config/db');

const CAMPOS = 'id, comanda_id, usuario_id, subtotal, descuento_total, propina, total, created_at';

// exec permite ejecutar dentro de una transacción.
async function crear({ comandaId, usuarioId, subtotal, descuentoTotal, propina, total }, exec = query) {
  const { rows } = await exec(
    `INSERT INTO ventas (comanda_id, usuario_id, subtotal, descuento_total, propina, total)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${CAMPOS}`,
    [comandaId, usuarioId, subtotal, descuentoTotal, propina, total]
  );
  return rows[0];
}

async function buscarPorId(id) {
  const { rows } = await query(`SELECT ${CAMPOS} FROM ventas WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function listar() {
  const { rows } = await query(`SELECT ${CAMPOS} FROM ventas ORDER BY id DESC`);
  return rows;
}

module.exports = { crear, buscarPorId, listar };
