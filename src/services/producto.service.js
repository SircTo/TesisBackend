'use strict';

const { withTransaction } = require('../config/db');
const productoModel = require('../models/producto.model');
const categoriaModel = require('../models/categoria.model');
const movimientoModel = require('../models/movimientoStock.model');
const trazabilidad = require('../models/trazabilidad.model');
const avisoService = require('./avisoStock.service');
const ApiError = require('../utils/apiError');

const FK_VIOLATION = '23503';

async function asegurarCategoria(categoriaId) {
  const categoria = await categoriaModel.buscarPorId(categoriaId);
  if (!categoria) throw new ApiError(400, 'La categoría indicada no existe.');
}

async function listar(filtros) {
  return productoModel.listar(filtros);
}

async function obtener(id) {
  const producto = await productoModel.buscarPorId(id);
  if (!producto) throw new ApiError(404, 'Producto no encontrado.');
  return producto;
}

async function crear(datos, actorId) {
  if (datos.categoriaId) await asegurarCategoria(datos.categoriaId);

  // Crear el producto y registrar el ingreso de stock inicial en una sola transacción.
  const producto = await withTransaction(async (client) => {
    const exec = (text, params) => client.query(text, params);
    let creado;
    try {
      creado = await productoModel.crear(datos, exec);
    } catch (err) {
      if (err.code === FK_VIOLATION) throw new ApiError(400, 'La categoría indicada no existe.');
      throw err;
    }
    if (creado.stock > 0) {
      await movimientoModel.registrar(
        { productoId: creado.id, usuarioId: actorId, tipo: 'ingreso', cantidad: creado.stock, motivo: 'Stock inicial' },
        exec
      );
    }
    return creado;
  });

  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'crear', entidad: 'productos', entidadId: producto.id,
    detalle: `Creó el producto "${producto.nombre}"`,
  });
  await avisoService.evaluar(producto);
  return producto;
}

async function actualizar(id, cambios, actorId) {
  await obtener(id);
  if (cambios.categoriaId !== undefined) await asegurarCategoria(cambios.categoriaId);

  let producto;
  try {
    producto = await productoModel.actualizar(id, cambios);
  } catch (err) {
    if (err.code === FK_VIOLATION) throw new ApiError(400, 'La categoría indicada no existe.');
    throw err;
  }
  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'modificar', entidad: 'productos', entidadId: id,
    detalle: `Modificó el producto "${producto.nombre}"`,
  });
  // El stock_minimo pudo cambiar, así que se re-evalúa el aviso.
  await avisoService.evaluar(producto);
  return producto;
}

/**
 * Ajusta el stock de un producto (RF_17): registra el movimiento con el usuario
 * responsable y el motivo, de forma atómica, y re-evalúa el aviso de stock.
 */
async function ajustarStock(id, { cantidad, motivo }, actorId) {
  await obtener(id); // 404 si no existe
  const tipo = cantidad >= 0 ? 'ingreso' : 'ajuste';

  const producto = await withTransaction(async (client) => {
    const exec = (text, params) => client.query(text, params);
    const actualizado = await productoModel.ajustarStock(id, cantidad, exec);
    if (!actualizado) throw new ApiError(400, 'El ajuste dejaría el stock en negativo.');
    await movimientoModel.registrar(
      { productoId: id, usuarioId: actorId, tipo, cantidad, motivo },
      exec
    );
    return actualizado;
  });

  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'ajustar_stock', entidad: 'productos', entidadId: id,
    detalle: `Ajustó el stock de "${producto.nombre}" en ${cantidad} (motivo: ${motivo || 'sin motivo'})`,
  });
  await avisoService.evaluar(producto);
  return producto;
}

async function historialStock(id) {
  await obtener(id);
  return movimientoModel.listarPorProducto(id);
}

/**
 * Revisión de inventario: recibe el stock real contado por producto y corrige
 * las diferencias en una sola transacción, registrando cada movimiento y su
 * responsable. Los productos con stock correcto no generan movimiento.
 */
async function revisarInventario(items, actorId) {
  const afectados = [];
  await withTransaction(async (client) => {
    const exec = (text, params) => client.query(text, params);
    for (const it of items) {
      const producto = await productoModel.buscarPorId(it.productoId);
      if (!producto) throw new ApiError(404, `El producto ${it.productoId} no existe.`);
      const delta = it.stockReal - producto.stock;
      if (delta === 0) continue; // stock correcto: sin cambios
      const actualizado = await productoModel.ajustarStock(it.productoId, delta, exec);
      if (!actualizado) throw new ApiError(400, `El stock corregido de "${producto.nombre}" no puede ser negativo.`);
      await movimientoModel.registrar(
        { productoId: it.productoId, usuarioId: actorId, tipo: 'ajuste', cantidad: delta, motivo: 'Revisión de inventario' },
        exec
      );
      afectados.push(actualizado);
    }
  });

  for (const p of afectados) await avisoService.evaluar(p);
  if (afectados.length > 0) {
    await trazabilidad.registrar({
      usuarioId: actorId, accion: 'revisar_inventario', entidad: 'productos', entidadId: null,
      detalle: `Revisión de inventario: ${afectados.length} producto(s) corregido(s)`,
    });
  }
  return { corregidos: afectados.length };
}

module.exports = { listar, obtener, crear, actualizar, ajustarStock, historialStock, revisarInventario };
