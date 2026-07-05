'use strict';

const { query } = require('../config/db');

/**
 * Registra una acción en el historial de trazabilidad (RF_24).
 * @param {object} datos
 * @param {number|null} datos.usuarioId  Usuario que realizó la acción
 * @param {string} datos.accion          crear | modificar | anular | registrar...
 * @param {string} datos.entidad         Tabla afectada (usuarios, comandas, ...)
 * @param {number|null} [datos.entidadId] Id del registro afectado
 * @param {string|null} [datos.detalle]   Descripción libre
 */
async function registrar({ usuarioId, accion, entidad, entidadId = null, detalle = null }) {
  await query(
    `INSERT INTO trazabilidad (usuario_id, accion, entidad, entidad_id, detalle)
     VALUES ($1, $2, $3, $4, $5)`,
    [usuarioId, accion, entidad, entidadId, detalle]
  );
}

module.exports = { registrar };
