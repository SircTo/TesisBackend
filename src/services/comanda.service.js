'use strict';

const { withTransaction } = require('../config/db');
const comandaModel = require('../models/comanda.model');
const detalleModel = require('../models/comandaDetalle.model');
const mesaModel = require('../models/mesa.model');
const productoModel = require('../models/producto.model');
const tipoClienteModel = require('../models/tipoCliente.model');
const movimientoModel = require('../models/movimientoStock.model');
const avisoService = require('./avisoStock.service');
const trazabilidad = require('../models/trazabilidad.model');
const ApiError = require('../utils/apiError');

const UNIQUE_VIOLATION = '23505';

// Transiciones de estado permitidas por este módulo (RF_09).
// 'pagada' ocurre en el módulo de ventas; 'anulada' vía anular().
const TRANSICIONES = {
  abierta: ['en_preparacion'],
  en_preparacion: ['entregada'],
};

/** Calcula subtotal, descuento por tipo de cliente y total (en pesos, enteros). */
function calcularResumen(comanda, items) {
  let subtotal = 0;
  for (const it of items) {
    const bruto = it.precio_unitario * it.cantidad;
    const desc = Math.round((bruto * Number(it.descuento_porcentaje)) / 100);
    subtotal += bruto - desc;
  }
  const pct = Number(comanda.descuento_tipo_cliente_porcentaje) || 0;
  const descuentoTipoCliente = Math.round((subtotal * pct) / 100);
  return { subtotal, descuento_tipo_cliente: descuentoTipoCliente, total: subtotal - descuentoTipoCliente };
}

async function obtener(id) {
  const comanda = await comandaModel.buscarPorId(id);
  if (!comanda) throw new ApiError(404, 'Comanda no encontrada.');
  const items = await detalleModel.listarPorComanda(id);
  return { ...comanda, items, resumen: calcularResumen(comanda, items) };
}

async function listar(filtros) {
  return comandaModel.listar(filtros);
}

async function crear(datos, actorId) {
  const mesa = await mesaModel.buscarPorId(datos.mesaId);
  if (!mesa) throw new ApiError(404, 'La mesa indicada no existe.');

  let descuentoPct = null;
  if (datos.tipoClienteId) {
    const tc = await tipoClienteModel.buscarPorId(datos.tipoClienteId);
    if (!tc) throw new ApiError(400, 'El tipo de cliente indicado no existe.');
    descuentoPct = tc.porcentaje_descuento;
  }

  let comanda;
  try {
    comanda = await withTransaction(async (client) => {
      const exec = (t, p) => client.query(t, p);
      const c = await comandaModel.crear(
        {
          mesaId: datos.mesaId,
          tipoClienteId: datos.tipoClienteId,
          usuarioId: actorId,
          descuentoTipoClientePorcentaje: descuentoPct,
          observaciones: datos.observaciones,
        },
        exec
      );
      await mesaModel.cambiarEstado(datos.mesaId, 'ocupada', exec);
      return c;
    });
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw new ApiError(409, 'La mesa ya tiene una comanda activa.');
    throw err;
  }

  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'crear', entidad: 'comandas', entidadId: comanda.id,
    detalle: `Creó comanda en la mesa ${comanda.mesa_id}`,
  });
  return obtener(comanda.id);
}

async function agregarItem(comandaId, datos, actorId) {
  const comanda = await comandaModel.buscarPorId(comandaId);
  if (!comanda) throw new ApiError(404, 'Comanda no encontrada.');
  if (comanda.estado !== 'abierta') {
    throw new ApiError(409, 'Solo se pueden agregar productos a una comanda abierta.');
  }

  const producto = await productoModel.buscarPorId(datos.productoId);
  if (!producto) throw new ApiError(404, 'Producto no encontrado.');
  if (!producto.disponibilidad || producto.estado !== 'activo') {
    throw new ApiError(409, 'El producto no está disponible.');
  }
  if (producto.stock < datos.cantidad) {
    throw new ApiError(409, 'Stock insuficiente para el producto.');
  }

  await detalleModel.agregar({
    comandaId,
    productoId: datos.productoId,
    cantidad: datos.cantidad,
    precioUnitario: producto.precio, // precio "foto"
    descuentoPorcentaje: datos.descuentoPorcentaje,
    observaciones: datos.observaciones,
  });
  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'agregar_item', entidad: 'comandas', entidadId: comandaId,
    detalle: `Agregó ${datos.cantidad}x "${producto.nombre}" a la comanda #${comandaId}`,
  });
  return obtener(comandaId);
}

async function eliminarItem(comandaId, itemId, actorId) {
  const comanda = await comandaModel.buscarPorId(comandaId);
  if (!comanda) throw new ApiError(404, 'Comanda no encontrada.');
  if (comanda.estado !== 'abierta') {
    throw new ApiError(409, 'Solo se pueden quitar productos de una comanda abierta.');
  }
  const item = await detalleModel.buscarPorId(itemId);
  if (!item || item.comanda_id !== comandaId) {
    throw new ApiError(404, 'Ítem no encontrado en la comanda.');
  }
  await detalleModel.eliminar(itemId);
  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'quitar_item', entidad: 'comandas', entidadId: comandaId,
    detalle: `Quitó un ítem de la comanda #${comandaId}`,
  });
  return obtener(comandaId);
}

// Editar comanda (solo abierta, RF_12): tipo de cliente y/o observaciones.
async function actualizar(id, cambios, actorId) {
  const comanda = await comandaModel.buscarPorId(id);
  if (!comanda) throw new ApiError(404, 'Comanda no encontrada.');
  if (comanda.estado !== 'abierta') {
    throw new ApiError(409, 'Solo se puede editar una comanda abierta.');
  }

  let tipoClienteId = comanda.tipo_cliente_id;
  let descuentoPct = comanda.descuento_tipo_cliente_porcentaje;
  if (cambios.tipoClienteId !== undefined) {
    if (cambios.tipoClienteId === null) {
      tipoClienteId = null;
      descuentoPct = null;
    } else {
      const tc = await tipoClienteModel.buscarPorId(cambios.tipoClienteId);
      if (!tc) throw new ApiError(400, 'El tipo de cliente indicado no existe.');
      tipoClienteId = cambios.tipoClienteId;
      descuentoPct = tc.porcentaje_descuento;
    }
  }
  const observaciones = cambios.observaciones !== undefined ? cambios.observaciones : comanda.observaciones;

  await comandaModel.actualizar(id, { tipoClienteId, descuentoTipoClientePorcentaje: descuentoPct, observaciones });
  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'modificar', entidad: 'comandas', entidadId: id,
    detalle: `Modificó la comanda #${id}`,
  });
  return obtener(id);
}

// Cambio de estado (RF_09): confirmar (descuenta stock, RF_10/11) o entregar.
async function cambiarEstado(id, nuevoEstado, actorId) {
  const comanda = await comandaModel.buscarPorId(id);
  if (!comanda) throw new ApiError(404, 'Comanda no encontrada.');
  const permitidas = TRANSICIONES[comanda.estado] || [];
  if (!permitidas.includes(nuevoEstado)) {
    throw new ApiError(409, `No se puede pasar de "${comanda.estado}" a "${nuevoEstado}".`);
  }

  const productosAfectados = [];
  if (nuevoEstado === 'en_preparacion') {
    const items = await detalleModel.listarPorComanda(id);
    if (items.length === 0) throw new ApiError(409, 'No se puede confirmar una comanda sin productos.');

    await withTransaction(async (client) => {
      const exec = (t, p) => client.query(t, p);
      for (const it of items) {
        const prod = await productoModel.ajustarStock(it.producto_id, -it.cantidad, exec);
        if (!prod) throw new ApiError(409, `Stock insuficiente para "${it.producto_nombre}".`);
        await movimientoModel.registrar(
          { productoId: it.producto_id, usuarioId: actorId, tipo: 'venta', cantidad: -it.cantidad, motivo: `Comanda #${id}` },
          exec
        );
        productosAfectados.push(prod);
      }
      await comandaModel.cambiarEstado(id, nuevoEstado, exec);
    });
  } else {
    await comandaModel.cambiarEstado(id, nuevoEstado);
  }

  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'cambiar_estado', entidad: 'comandas', entidadId: id,
    detalle: `Comanda #${id}: ${comanda.estado} → ${nuevoEstado}`,
  });
  for (const p of productosAfectados) await avisoService.evaluar(p);
  return obtener(id);
}

// Anular (solo admin, RF_13): si el stock ya fue descontado, se devuelve; libera la mesa.
async function anular(id, actorId) {
  const comanda = await comandaModel.buscarPorId(id);
  if (!comanda) throw new ApiError(404, 'Comanda no encontrada.');
  if (comanda.estado === 'pagada' || comanda.estado === 'anulada') {
    throw new ApiError(409, `No se puede anular una comanda en estado "${comanda.estado}".`);
  }

  const stockDescontado = comanda.estado === 'en_preparacion' || comanda.estado === 'entregada';
  const items = stockDescontado ? await detalleModel.listarPorComanda(id) : [];
  const productosAfectados = [];

  await withTransaction(async (client) => {
    const exec = (t, p) => client.query(t, p);
    for (const it of items) {
      const prod = await productoModel.ajustarStock(it.producto_id, it.cantidad, exec);
      await movimientoModel.registrar(
        { productoId: it.producto_id, usuarioId: actorId, tipo: 'ingreso', cantidad: it.cantidad, motivo: `Anulación comanda #${id}` },
        exec
      );
      if (prod) productosAfectados.push(prod);
    }
    await comandaModel.cambiarEstado(id, 'anulada', exec);
    await mesaModel.cambiarEstado(comanda.mesa_id, 'libre', exec);
  });

  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'anular', entidad: 'comandas', entidadId: id,
    detalle: `Anuló la comanda #${id}`,
  });
  for (const p of productosAfectados) await avisoService.evaluar(p);
  return obtener(id);
}

// Solicitar la cuenta (RF_04): marca la mesa como "pagando" para una comanda entregada.
async function solicitarCuenta(id, actorId) {
  const comanda = await comandaModel.buscarPorId(id);
  if (!comanda) throw new ApiError(404, 'Comanda no encontrada.');
  if (comanda.estado !== 'entregada') {
    throw new ApiError(409, 'Solo se puede solicitar la cuenta de una comanda entregada.');
  }
  await mesaModel.cambiarEstado(comanda.mesa_id, 'pagando');
  await trazabilidad.registrar({
    usuarioId: actorId, accion: 'solicitar_cuenta', entidad: 'comandas', entidadId: id,
    detalle: `Solicitó la cuenta de la comanda #${id}`,
  });
  return obtener(id);
}

module.exports = { obtener, listar, crear, agregarItem, eliminarItem, actualizar, cambiarEstado, anular, solicitarCuenta };
