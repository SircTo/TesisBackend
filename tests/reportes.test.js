'use strict';

const request = require('supertest');

jest.mock('../src/models/reporte.model');
const reporteModel = require('../src/models/reporte.model');

const app = require('../src/app');
const { tokenPara } = require('./helpers');

const ADMIN = () => `Bearer ${tokenPara('administrador')}`;
const GARZON = () => `Bearer ${tokenPara('garzon')}`;

describe('/api/reportes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 sin token', async () => {
    const res = await request(app).get('/api/reportes/ventas');
    expect(res.status).toBe(401);
  });

  it('403 un garzón no puede ver reportes', async () => {
    const res = await request(app).get('/api/reportes/ingresos').set('Authorization', GARZON());
    expect(res.status).toBe(403);
  });

  it('200 reporte de ventas', async () => {
    reporteModel.ventas.mockResolvedValue([{ id: 1, total: 5000, tipos_pago: 'efectivo' }]);
    const res = await request(app).get('/api/reportes/ventas').set('Authorization', ADMIN());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('400 si un filtro de fecha es inválido', async () => {
    const res = await request(app).get('/api/reportes/ventas?desde=noesfecha').set('Authorization', ADMIN());
    expect(res.status).toBe(400);
  });

  it('400 si producto_id no es un entero positivo', async () => {
    const res = await request(app).get('/api/reportes/ventas?producto_id=abc').set('Authorization', ADMIN());
    expect(res.status).toBe(400);
  });

  it('200 productos más vendidos', async () => {
    reporteModel.productosMasVendidos.mockResolvedValue([{ producto_id: 1, nombre: 'Café', cantidad_vendida: 10 }]);
    const res = await request(app).get('/api/reportes/productos-mas-vendidos').set('Authorization', ADMIN());
    expect(res.status).toBe(200);
    expect(res.body[0].cantidad_vendida).toBe(10);
  });

  it('200 ingresos con desglose por tipo de pago', async () => {
    reporteModel.ingresos.mockResolvedValue({
      resumen: { cantidad_ventas: 2, ingresos_totales: 10000, propinas_totales: 1000 },
      por_tipo_pago: [{ tipo_pago: 'efectivo', monto: 6000 }, { tipo_pago: 'tarjeta', monto: 4000 }],
    });
    const res = await request(app).get('/api/reportes/ingresos').set('Authorization', ADMIN());
    expect(res.status).toBe(200);
    expect(res.body.resumen.ingresos_totales).toBe(10000);
    expect(res.body.por_tipo_pago).toHaveLength(2);
  });

  it('200 stock actual', async () => {
    reporteModel.stockActual.mockResolvedValue([{ id: 1, nombre: 'Café', stock: 3, stock_minimo: 5, bajo_minimo: true }]);
    const res = await request(app).get('/api/reportes/stock?bajo_minimo=true').set('Authorization', ADMIN());
    expect(res.status).toBe(200);
    expect(res.body[0].bajo_minimo).toBe(true);
  });

  it('200 movimientos (trazabilidad)', async () => {
    reporteModel.movimientos.mockResolvedValue([{ id: 1, usuario: 'Admin', accion: 'crear', entidad: 'productos' }]);
    const res = await request(app).get('/api/reportes/movimientos?usuario_id=1').set('Authorization', ADMIN());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
