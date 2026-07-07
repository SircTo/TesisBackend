'use strict';

const { query } = require('../config/db');

const CAMPOS = 'id, numero, zona_id, estado';

/**
 * Lista mesas; si se entrega zonaId, filtra por esa zona.
 */
async function listar(zonaId) {
  if (zonaId) {
    const { rows } = await query(
      `SELECT ${CAMPOS} FROM mesas WHERE zona_id = $1 ORDER BY numero`,
      [zonaId]
    );
    return rows;
  }
  const { rows } = await query(`SELECT ${CAMPOS} FROM mesas ORDER BY zona_id, numero`);
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await query(`SELECT ${CAMPOS} FROM mesas WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function crear({ numero, zonaId, estado }) {
  const { rows } = await query(
    `INSERT INTO mesas (numero, zona_id, estado)
     VALUES ($1, $2, COALESCE($3, 'libre'))
     RETURNING ${CAMPOS}`,
    [numero, zonaId, estado || null]
  );
  return rows[0];
}

async function actualizar(id, { numero, zonaId, estado }) {
  const { rows } = await query(
    `UPDATE mesas SET
       numero  = COALESCE($2, numero),
       zona_id = COALESCE($3, zona_id),
       estado  = COALESCE($4, estado)
     WHERE id = $1
     RETURNING ${CAMPOS}`,
    [id, numero || null, zonaId || null, estado || null]
  );
  return rows[0] || null;
}

// Cambia solo el estado de la mesa (libre/ocupada/pagando). exec permite usarlo dentro de una transacción.
async function cambiarEstado(id, estado, exec = query) {
  const { rows } = await exec(
    `UPDATE mesas SET estado = $2 WHERE id = $1 RETURNING ${CAMPOS}`,
    [id, estado]
  );
  return rows[0] || null;
}

module.exports = { listar, buscarPorId, crear, actualizar, cambiarEstado };
