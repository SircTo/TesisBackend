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

// Lista una página de ventas, opcionalmente filtrada por mes ('YYYY-MM').
async function listar({ mes = null, limit = 20, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT ${CAMPOS} FROM ventas
     WHERE ($1::text IS NULL OR to_char(created_at, 'YYYY-MM') = $1)
     ORDER BY created_at DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [mes, limit, offset]
  );
  return rows;
}

// Cuenta el total de ventas (con el mismo filtro), para calcular las páginas.
async function contar({ mes = null } = {}) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM ventas
     WHERE ($1::text IS NULL OR to_char(created_at, 'YYYY-MM') = $1)`,
    [mes]
  );
  return rows[0].total;
}

module.exports = { crear, buscarPorId, listar, contar };
