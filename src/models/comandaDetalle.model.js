'use strict';

const { query } = require('../config/db');

async function listarPorComanda(comandaId) {
  const { rows } = await query(
    `SELECT cd.id, cd.producto_id, p.nombre AS producto_nombre, cd.cantidad,
            cd.precio_unitario, cd.descuento_porcentaje, cd.observaciones
     FROM comanda_detalle cd
     JOIN productos p ON p.id = cd.producto_id
     WHERE cd.comanda_id = $1
     ORDER BY cd.id`,
    [comandaId]
  );
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await query(
    `SELECT id, comanda_id, producto_id, cantidad, precio_unitario, descuento_porcentaje, observaciones
     FROM comanda_detalle WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

// exec permite ejecutar dentro de una transacción.
async function agregar({ comandaId, productoId, cantidad, precioUnitario, descuentoPorcentaje, observaciones }, exec = query) {
  const { rows } = await exec(
    `INSERT INTO comanda_detalle (comanda_id, producto_id, cantidad, precio_unitario, descuento_porcentaje, observaciones)
     VALUES ($1, $2, $3, $4, COALESCE($5, 0), $6)
     RETURNING id, comanda_id, producto_id, cantidad, precio_unitario, descuento_porcentaje, observaciones`,
    [comandaId, productoId, cantidad, precioUnitario, descuentoPorcentaje ?? null, observaciones || null]
  );
  return rows[0];
}

async function buscarEnComandaPorProducto(comandaId, productoId, exec = query) {
  const { rows } = await exec(
    `SELECT id, comanda_id, producto_id, cantidad, precio_unitario, descuento_porcentaje, observaciones
     FROM comanda_detalle WHERE comanda_id = $1 AND producto_id = $2`,
    [comandaId, productoId]
  );
  return rows[0] || null;
}

async function actualizarCantidad(id, cantidad, exec = query) {
  const { rows } = await exec(
    `UPDATE comanda_detalle SET cantidad = $2 WHERE id = $1
     RETURNING id, comanda_id, producto_id, cantidad, precio_unitario, descuento_porcentaje, observaciones`,
    [id, cantidad]
  );
  return rows[0] || null;
}

async function eliminar(id, exec = query) {
  const { rowCount } = await exec(`DELETE FROM comanda_detalle WHERE id = $1`, [id]);
  return rowCount > 0;
}

module.exports = { listarPorComanda, buscarPorId, buscarEnComandaPorProducto, actualizarCantidad, agregar, eliminar };
