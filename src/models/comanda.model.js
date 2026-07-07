'use strict';

const { query } = require('../config/db');

const CAMPOS =
  'id, mesa_id, tipo_cliente_id, usuario_id, estado, descuento_tipo_cliente_porcentaje, propina, observaciones, created_at, updated_at';

// exec permite ejecutar dentro de una transacción.
async function crear({ mesaId, tipoClienteId, usuarioId, descuentoTipoClientePorcentaje, observaciones }, exec = query) {
  const { rows } = await exec(
    `INSERT INTO comandas (mesa_id, tipo_cliente_id, usuario_id, descuento_tipo_cliente_porcentaje, observaciones)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${CAMPOS}`,
    [mesaId, tipoClienteId || null, usuarioId, descuentoTipoClientePorcentaje ?? null, observaciones || null]
  );
  return rows[0];
}

async function buscarPorId(id) {
  const { rows } = await query(`SELECT ${CAMPOS} FROM comandas WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function listar({ estado, mesaId } = {}) {
  const cond = [];
  const params = [];
  if (estado) {
    params.push(estado);
    cond.push(`estado = $${params.length}`);
  }
  if (mesaId) {
    params.push(mesaId);
    cond.push(`mesa_id = $${params.length}`);
  }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
  const { rows } = await query(`SELECT ${CAMPOS} FROM comandas ${where} ORDER BY id DESC`, params);
  return rows;
}

// Los valores llegan ya resueltos desde el service (sin COALESCE: se puede fijar NULL).
async function actualizar(id, { tipoClienteId, descuentoTipoClientePorcentaje, observaciones }, exec = query) {
  const { rows } = await exec(
    `UPDATE comandas SET
       tipo_cliente_id                   = $2,
       descuento_tipo_cliente_porcentaje = $3,
       observaciones                     = $4,
       updated_at                        = now()
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [id, tipoClienteId ?? null, descuentoTipoClientePorcentaje ?? null, observaciones ?? null]
  );
  return rows[0] || null;
}

async function cambiarEstado(id, estado, exec = query) {
  const { rows } = await exec(
    `UPDATE comandas SET estado = $2, updated_at = now() WHERE id = $1 RETURNING ${CAMPOS}`,
    [id, estado]
  );
  return rows[0] || null;
}

module.exports = { crear, buscarPorId, listar, actualizar, cambiarEstado };
