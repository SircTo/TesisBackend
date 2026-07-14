'use strict';

const { query } = require('../config/db');

// Reporte de ventas con filtros y paginación (RF_22, IS_04).
async function ventas({ desde, hasta, productoId, usuarioId, page = 1, pageSize = 20 } = {}) {
  const cond = [];
  const params = [];
  if (desde) { params.push(desde); cond.push(`v.created_at >= $${params.length}`); }
  if (hasta) { params.push(hasta); cond.push(`v.created_at <= $${params.length}`); }
  if (usuarioId) { params.push(usuarioId); cond.push(`v.usuario_id = $${params.length}`); }
  if (productoId) {
    params.push(productoId);
    cond.push(`EXISTS (SELECT 1 FROM comanda_detalle cd WHERE cd.comanda_id = v.comanda_id AND cd.producto_id = $${params.length})`);
  }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

  const { rows: cRows } = await query(`SELECT COUNT(*)::int AS total FROM ventas v ${where}`, params);
  const total = cRows[0].total;

  params.push(pageSize);
  const pLimit = params.length;
  params.push((page - 1) * pageSize);
  const pOffset = params.length;
  const { rows } = await query(
    `SELECT v.id, v.created_at AS fecha, c.mesa_id, m.numero AS mesa_numero,
            u.nombre AS usuario, tc.nombre AS tipo_cliente,
            v.subtotal, v.descuento_total, v.propina, v.total,
            (SELECT string_agg(DISTINCT p.tipo_pago, ', ') FROM pagos p WHERE p.venta_id = v.id) AS tipos_pago
     FROM ventas v
     JOIN comandas c ON c.id = v.comanda_id
     JOIN mesas m ON m.id = c.mesa_id
     JOIN usuarios u ON u.id = v.usuario_id
     LEFT JOIN tipos_cliente tc ON tc.id = c.tipo_cliente_id
     ${where}
     ORDER BY v.created_at DESC
     LIMIT $${pLimit} OFFSET $${pOffset}`,
    params
  );
  return { data: rows, total };
}

// Productos más vendidos (RF_23, IS_05). Solo cuenta comandas efectivamente vendidas.
async function productosMasVendidos({ desde, hasta, limite = 50 } = {}) {
  const cond = [];
  const params = [];
  if (desde) { params.push(desde); cond.push(`v.created_at >= $${params.length}`); }
  if (hasta) { params.push(hasta); cond.push(`v.created_at <= $${params.length}`); }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
  params.push(limite);
  const { rows } = await query(
    `SELECT cd.producto_id, p.nombre,
            SUM(cd.cantidad)::int AS cantidad_vendida,
            SUM(cd.cantidad * cd.precio_unitario)::int AS total_bruto
     FROM comanda_detalle cd
     JOIN ventas v ON v.comanda_id = cd.comanda_id
     JOIN productos p ON p.id = cd.producto_id
     ${where}
     GROUP BY cd.producto_id, p.nombre
     ORDER BY cantidad_vendida DESC
     LIMIT $${params.length}`,
    params
  );
  return rows;
}

// Ingresos totales y desglose por tipo de pago (RF_23, IS_05).
async function ingresos({ desde, hasta } = {}) {
  const cond = [];
  const params = [];
  if (desde) { params.push(desde); cond.push(`created_at >= $${params.length}`); }
  if (hasta) { params.push(hasta); cond.push(`created_at <= $${params.length}`); }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
  const { rows: resumenRows } = await query(
    `SELECT COUNT(*)::int AS cantidad_ventas,
            COALESCE(SUM(total), 0)::int AS ingresos_totales,
            COALESCE(SUM(propina), 0)::int AS propinas_totales
     FROM ventas ${where}`,
    params
  );

  const condP = [];
  const paramsP = [];
  if (desde) { paramsP.push(desde); condP.push(`v.created_at >= $${paramsP.length}`); }
  if (hasta) { paramsP.push(hasta); condP.push(`v.created_at <= $${paramsP.length}`); }
  const whereP = condP.length ? `WHERE ${condP.join(' AND ')}` : '';
  const { rows: porTipoPago } = await query(
    `SELECT p.tipo_pago, COALESCE(SUM(p.monto), 0)::int AS monto
     FROM pagos p JOIN ventas v ON v.id = p.venta_id
     ${whereP}
     GROUP BY p.tipo_pago ORDER BY p.tipo_pago`,
    paramsP
  );

  return { resumen: resumenRows[0], por_tipo_pago: porTipoPago };
}

// Stock actual de productos activos, paginado (RF_23, IS_03).
async function stockActual({ area, soloBajoMinimo, page = 1, pageSize = 20 } = {}) {
  const cond = [`p.estado = 'activo'`];
  const params = [];
  if (area) { params.push(area); cond.push(`p.area = $${params.length}`); }
  if (soloBajoMinimo) cond.push(`p.stock <= p.stock_minimo`);
  const where = `WHERE ${cond.join(' AND ')}`;

  const { rows: cRows } = await query(`SELECT COUNT(*)::int AS total FROM productos p ${where}`, params);
  const total = cRows[0].total;

  params.push(pageSize);
  const pLimit = params.length;
  params.push((page - 1) * pageSize);
  const pOffset = params.length;
  const { rows } = await query(
    `SELECT p.id, p.nombre, cat.nombre AS categoria, p.stock, p.stock_minimo,
            p.disponibilidad, p.area, (p.stock <= p.stock_minimo) AS bajo_minimo
     FROM productos p LEFT JOIN categorias cat ON cat.id = p.categoria_id
     ${where}
     ORDER BY p.nombre
     LIMIT $${pLimit} OFFSET $${pOffset}`,
    params
  );
  return { data: rows, total };
}

// Historial de movimientos/acciones por usuario, paginado (RF_23, RF_24, IS_06).
async function movimientos({ usuarioId, desde, hasta, page = 1, pageSize = 20 } = {}) {
  const cond = [];
  const params = [];
  if (usuarioId) { params.push(usuarioId); cond.push(`t.usuario_id = $${params.length}`); }
  if (desde) { params.push(desde); cond.push(`t.created_at >= $${params.length}`); }
  if (hasta) { params.push(hasta); cond.push(`t.created_at <= $${params.length}`); }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

  const { rows: cRows } = await query(`SELECT COUNT(*)::int AS total FROM trazabilidad t ${where}`, params);
  const total = cRows[0].total;

  params.push(pageSize);
  const pLimit = params.length;
  params.push((page - 1) * pageSize);
  const pOffset = params.length;
  const { rows } = await query(
    `SELECT t.id, t.usuario_id, u.nombre AS usuario, t.accion, t.entidad, t.entidad_id, t.detalle, t.created_at
     FROM trazabilidad t LEFT JOIN usuarios u ON u.id = t.usuario_id
     ${where}
     ORDER BY t.id DESC
     LIMIT $${pLimit} OFFSET $${pOffset}`,
    params
  );
  return { data: rows, total };
}

module.exports = { ventas, productosMasVendidos, ingresos, stockActual, movimientos };
