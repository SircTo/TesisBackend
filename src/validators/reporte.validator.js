'use strict';

const ApiError = require('../utils/apiError');

const AREAS = ['cocina', 'barra'];
const esEnteroPositivo = (v) => Number.isInteger(v) && v > 0;

function parseFecha(valor, nombre, finDelDia = false) {
  if (valor === undefined) return undefined;
  if (typeof valor !== 'string' || Number.isNaN(Date.parse(valor))) {
    throw new ApiError(400, `${nombre} debe ser una fecha válida (por ejemplo YYYY-MM-DD).`);
  }
  // Si viene solo la fecha y es el extremo "hasta", se incluye todo el día.
  if (finDelDia && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return `${valor}T23:59:59.999`;
  return valor;
}

function parseIdOpcional(valor, nombre) {
  if (valor === undefined) return undefined;
  const n = Number(valor);
  if (!esEnteroPositivo(n)) throw new ApiError(400, `${nombre} debe ser un entero positivo.`);
  return n;
}

function parseLimite(valor, porDefecto) {
  if (valor === undefined) return porDefecto;
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0 || n > 1000) {
    throw new ApiError(400, 'limite debe ser un entero entre 1 y 1000.');
  }
  return n;
}

function validarFiltrosVentas(q = {}) {
  return {
    desde: parseFecha(q.desde, 'desde'),
    hasta: parseFecha(q.hasta, 'hasta', true),
    productoId: parseIdOpcional(q.producto_id, 'producto_id'),
    usuarioId: parseIdOpcional(q.usuario_id, 'usuario_id'),
  };
}

function validarRango(q = {}) {
  return {
    desde: parseFecha(q.desde, 'desde'),
    hasta: parseFecha(q.hasta, 'hasta', true),
    limite: parseLimite(q.limite, 50),
  };
}

function validarFiltrosMovimientos(q = {}) {
  return {
    usuarioId: parseIdOpcional(q.usuario_id, 'usuario_id'),
    desde: parseFecha(q.desde, 'desde'),
    hasta: parseFecha(q.hasta, 'hasta', true),
    limite: parseLimite(q.limite, 200),
  };
}

function validarFiltrosStock(q = {}) {
  let area;
  if (q.area !== undefined) {
    if (!AREAS.includes(q.area)) throw new ApiError(400, `area debe ser una de: ${AREAS.join(', ')}.`);
    area = q.area;
  }
  return { area, soloBajoMinimo: q.bajo_minimo === 'true' };
}

module.exports = {
  validarFiltrosVentas,
  validarRango,
  validarFiltrosMovimientos,
  validarFiltrosStock,
};
