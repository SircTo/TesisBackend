'use strict';

const { query } = require('../config/db');

// exec permite ejecutar dentro de una transacción.
async function crear({ ventaId, tipoPago, monto }, exec = query) {
  const { rows } = await exec(
    `INSERT INTO pagos (venta_id, tipo_pago, monto)
     VALUES ($1, $2, $3)
     RETURNING id, venta_id, tipo_pago, monto`,
    [ventaId, tipoPago, monto]
  );
  return rows[0];
}

async function listarPorVenta(ventaId) {
  const { rows } = await query(
    `SELECT id, venta_id, tipo_pago, monto FROM pagos WHERE venta_id = $1 ORDER BY id`,
    [ventaId]
  );
  return rows;
}

module.exports = { crear, listarPorVenta };
