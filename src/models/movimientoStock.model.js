'use strict';

const { query } = require('../config/db');

// exec permite ejecutar dentro de una transacción (recibe client.query).
async function registrar({ productoId, usuarioId, tipo, cantidad, motivo }, exec = query) {
  const { rows } = await exec(
    `INSERT INTO movimientos_stock (producto_id, usuario_id, tipo, cantidad, motivo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, producto_id, usuario_id, tipo, cantidad, motivo, created_at`,
    [productoId, usuarioId, tipo, cantidad, motivo || null]
  );
  return rows[0];
}

async function listarPorProducto(productoId) {
  const { rows } = await query(
    `SELECT id, producto_id, usuario_id, tipo, cantidad, motivo, created_at
     FROM movimientos_stock
     WHERE producto_id = $1
     ORDER BY id DESC`,
    [productoId]
  );
  return rows;
}

module.exports = { registrar, listarPorProducto };
