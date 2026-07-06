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
  // La trazabilidad es auxiliar: si su registro falla, se avisa por log pero
  // NO se propaga el error, para no tumbar la operación principal que ya se realizó.
  try {
    await query(
      `INSERT INTO trazabilidad (usuario_id, accion, entidad, entidad_id, detalle)
       VALUES ($1, $2, $3, $4, $5)`,
      [usuarioId, accion, entidad, entidadId, detalle]
    );
  } catch (err) {
    console.warn(
      `[trazabilidad] No se pudo registrar "${accion}" sobre ${entidad}: ${err.message}`
    );
  }
}

module.exports = { registrar };
