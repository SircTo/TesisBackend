'use strict';

const ApiError = require('../utils/apiError');

const AREAS = ['cocina', 'barra'];
const ESTADOS = ['activo', 'inactivo'];

const esEnteroPositivo = (v) => Number.isInteger(v) && v > 0;
const esEnteroNoNegativo = (v) => Number.isInteger(v) && v >= 0;

function validarCrear(body = {}) {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  if (!nombre) throw new ApiError(400, 'El nombre del producto es obligatorio.');
  if (!esEnteroNoNegativo(body.precio)) {
    throw new ApiError(400, 'El precio debe ser un entero mayor o igual a 0.');
  }
  if (!AREAS.includes(body.area)) {
    throw new ApiError(400, `El área debe ser una de: ${AREAS.join(', ')}.`);
  }
  if (body.categoria_id !== undefined && !esEnteroPositivo(body.categoria_id)) {
    throw new ApiError(400, 'categoria_id debe ser un entero positivo.');
  }
  if (body.stock !== undefined && !esEnteroNoNegativo(body.stock)) {
    throw new ApiError(400, 'El stock debe ser un entero mayor o igual a 0.');
  }
  if (body.stock_minimo !== undefined && !esEnteroNoNegativo(body.stock_minimo)) {
    throw new ApiError(400, 'El stock mínimo debe ser un entero mayor o igual a 0.');
  }
  if (body.disponibilidad !== undefined && typeof body.disponibilidad !== 'boolean') {
    throw new ApiError(400, 'disponibilidad debe ser booleano (true/false).');
  }
  return {
    nombre,
    categoriaId: body.categoria_id,
    precio: body.precio,
    stock: body.stock,
    stockMinimo: body.stock_minimo,
    disponibilidad: body.disponibilidad,
    area: body.area,
  };
}

function validarActualizar(body = {}) {
  const cambios = {};
  if (body.nombre !== undefined) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    if (!nombre) throw new ApiError(400, 'El nombre no puede estar vacío.');
    cambios.nombre = nombre;
  }
  if (body.categoria_id !== undefined) {
    if (!esEnteroPositivo(body.categoria_id)) throw new ApiError(400, 'categoria_id debe ser un entero positivo.');
    cambios.categoriaId = body.categoria_id;
  }
  if (body.precio !== undefined) {
    if (!esEnteroNoNegativo(body.precio)) throw new ApiError(400, 'El precio debe ser un entero mayor o igual a 0.');
    cambios.precio = body.precio;
  }
  if (body.stock_minimo !== undefined) {
    if (!esEnteroNoNegativo(body.stock_minimo)) throw new ApiError(400, 'El stock mínimo debe ser un entero mayor o igual a 0.');
    cambios.stockMinimo = body.stock_minimo;
  }
  if (body.disponibilidad !== undefined) {
    if (typeof body.disponibilidad !== 'boolean') throw new ApiError(400, 'disponibilidad debe ser booleano (true/false).');
    cambios.disponibilidad = body.disponibilidad;
  }
  if (body.area !== undefined) {
    if (!AREAS.includes(body.area)) throw new ApiError(400, `El área debe ser una de: ${AREAS.join(', ')}.`);
    cambios.area = body.area;
  }
  if (body.estado !== undefined) {
    if (!ESTADOS.includes(body.estado)) throw new ApiError(400, `El estado debe ser uno de: ${ESTADOS.join(', ')}.`);
    cambios.estado = body.estado;
  }
  if (Object.keys(cambios).length === 0) {
    throw new ApiError(400, 'No se enviaron cambios para actualizar.');
  }
  return cambios;
}

function validarAjusteStock(body = {}) {
  if (!Number.isInteger(body.cantidad) || body.cantidad === 0) {
    throw new ApiError(400, 'cantidad debe ser un entero distinto de 0 (positivo suma, negativo descuenta).');
  }
  const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : undefined;
  return { cantidad: body.cantidad, motivo };
}

function validarFiltros(query = {}) {
  const f = {};
  if (query.categoria_id !== undefined) {
    const n = Number(query.categoria_id);
    if (!esEnteroPositivo(n)) throw new ApiError(400, 'categoria_id debe ser un entero positivo.');
    f.categoriaId = n;
  }
  if (query.area !== undefined) {
    if (!AREAS.includes(query.area)) throw new ApiError(400, `El área debe ser una de: ${AREAS.join(', ')}.`);
    f.area = query.area;
  }
  if (query.disponibilidad !== undefined) {
    if (query.disponibilidad !== 'true' && query.disponibilidad !== 'false') {
      throw new ApiError(400, 'disponibilidad debe ser true o false.');
    }
    f.disponibilidad = query.disponibilidad === 'true';
  }
  if (query.estado !== undefined) {
    if (!ESTADOS.includes(query.estado)) throw new ApiError(400, `El estado debe ser uno de: ${ESTADOS.join(', ')}.`);
    f.estado = query.estado;
  }
  return f;
}

// Revisión de inventario: lista de { producto_id, stock_real }.
function validarRevision(body = {}) {
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new ApiError(400, 'Debe incluir al menos un producto en la revisión.');
  }
  const items = body.items.map((it, i) => {
    if (!it || typeof it !== 'object') throw new ApiError(400, `El ítem ${i + 1} es inválido.`);
    if (!esEnteroPositivo(it.producto_id)) {
      throw new ApiError(400, `producto_id del ítem ${i + 1} debe ser un entero positivo.`);
    }
    if (!esEnteroNoNegativo(it.stock_real)) {
      throw new ApiError(400, `stock_real del ítem ${i + 1} debe ser un entero mayor o igual a 0.`);
    }
    return { productoId: it.producto_id, stockReal: it.stock_real };
  });
  return items;
}

module.exports = { validarCrear, validarActualizar, validarAjusteStock, validarFiltros, validarRevision };
