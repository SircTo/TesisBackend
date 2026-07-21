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

// Historial paginado de un producto (es un log: crece sin límite con cada ajuste/venta).
async function listarPorProducto(productoId, { page = 1, pageSize = 20 } = {}) {
  const { rows: cRows } = await query(
    `SELECT COUNT(*)::int AS total FROM movimientos_stock WHERE producto_id = $1`,
    [productoId]
  );
  const total = cRows[0].total;
  const { rows } = await query(
    `SELECT m.id, m.producto_id, m.usuario_id, u.nombre AS usuario, m.tipo, m.cantidad, m.motivo, m.created_at
     FROM movimientos_stock m
     LEFT JOIN usuarios u ON u.id = m.usuario_id
     WHERE m.producto_id = $1
     ORDER BY m.id DESC
     LIMIT $2 OFFSET $3`,
    [productoId, pageSize, (page - 1) * pageSize]
  );
  return { data: rows, total, page, pageSize };
}

module.exports = { registrar, listarPorProducto };
