'use strict';

const request = require('supertest');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn(), query: jest.fn(), on: jest.fn(), end: jest.fn() },
  withTransaction: (cb) => cb({ query: jest.fn().mockResolvedValue({ rows: [] }) }),
  testConnection: jest.fn(),
}));
jest.mock('../src/models/venta.model');
jest.mock('../src/models/pago.model');
jest.mock('../src/models/comanda.model');
jest.mock('../src/models/comandaDetalle.model');
jest.mock('../src/models/mesa.model');
jest.mock('../src/models/trazabilidad.model');

const ventaModel = require('../src/models/venta.model');
const pagoModel = require('../src/models/pago.model');
const comandaModel = require('../src/models/comanda.model');
const detalleModel = require('../src/models/comandaDetalle.model');

const app = require('../src/app');
const { tokenPara } = require('./helpers');

const GARZON = () => `Bearer ${tokenPara('garzon')}`;
const ADMIN = () => `Bearer ${tokenPara('administrador')}`;

// Deja una comanda entregada cuyo total calculado es 2000 (2 x 1000, sin descuentos).
function comandaEntregadaTotal2000() {
  comandaModel.buscarPorId.mockResolvedValue({ id: 1, mesa_id: 1, estado: 'entregada', descuento_tipo_cliente_porcentaje: null });
  detalleModel.listarPorComanda.mockResolvedValue([
    { id: 1, producto_id: 1, producto_nombre: 'Café', cantidad: 2, precio_unitario: 1000, descuento_porcentaje: '0' },
  ]);
}

describe('/api/ventas', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 sin token', async () => {
    const res = await request(app).post('/api/ventas').send({});
    expect(res.status).toBe(401);
  });

  it('403 un garzón no puede listar ventas', async () => {
    const res = await request(app).get('/api/ventas').set('Authorization', GARZON());
    expect(res.status).toBe(403);
  });

  it('200 lista ventas paginadas filtrando por mes', async () => {
    ventaModel.listar.mockResolvedValue([{ id: 3, comanda_id: 3, total: 5000, created_at: '2026-07-01T12:00:00Z' }]);
    ventaModel.contar.mockResolvedValue(1);
    const res = await request(app).get('/api/ventas?mes=2026-07&page=2&pageSize=10').set('Authorization', ADMIN());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, page: 2, pageSize: 10 });
    expect(res.body.data).toHaveLength(1);
    expect(ventaModel.listar).toHaveBeenCalledWith({ mes: '2026-07', limit: 10, offset: 10 });
    expect(ventaModel.contar).toHaveBeenCalledWith({ mes: '2026-07' });
  });

  it('200 ignora un mes con formato inválido (lo trata como sin filtro)', async () => {
    ventaModel.listar.mockResolvedValue([]);
    ventaModel.contar.mockResolvedValue(0);
    const res = await request(app).get('/api/ventas?mes=julio').set('Authorization', ADMIN());
    expect(res.status).toBe(200);
    expect(ventaModel.listar).toHaveBeenCalledWith({ mes: null, limit: 20, offset: 0 });
  });

  it('400 al cobrar sin pagos', async () => {
    const res = await request(app).post('/api/ventas').set('Authorization', GARZON()).send({ comanda_id: 1 });
    expect(res.status).toBe(400);
  });

  it('409 si la comanda no está entregada', async () => {
    comandaModel.buscarPorId.mockResolvedValue({ id: 1, estado: 'abierta' });
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', GARZON())
      .send({ comanda_id: 1, pagos: [{ tipo_pago: 'efectivo', monto: 2000 }] });
    expect(res.status).toBe(409);
  });

  it('400 si la suma de pagos no coincide con el monto a pagar', async () => {
    comandaEntregadaTotal2000();
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', GARZON())
      .send({ comanda_id: 1, pagos: [{ tipo_pago: 'efectivo', monto: 1000 }] });
    expect(res.status).toBe(400);
  });

  it('201 registra la venta con pago simple', async () => {
    comandaEntregadaTotal2000();
    ventaModel.crear.mockResolvedValue({ id: 1, comanda_id: 1, subtotal: 2000, descuento_total: 0, propina: 0, total: 2000 });
    ventaModel.buscarPorId.mockResolvedValue({ id: 1, comanda_id: 1, subtotal: 2000, descuento_total: 0, propina: 0, total: 2000 });
    pagoModel.listarPorVenta.mockResolvedValue([{ id: 1, venta_id: 1, tipo_pago: 'efectivo', monto: 2000 }]);
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', GARZON())
      .send({ comanda_id: 1, pagos: [{ tipo_pago: 'efectivo', monto: 2000 }] });
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(2000);
    expect(res.body.pagos).toHaveLength(1);
  });

  it('201 admite pago dividido entre tipos de pago (RF_20)', async () => {
    comandaEntregadaTotal2000();
    ventaModel.crear.mockResolvedValue({ id: 2, comanda_id: 1, total: 2000, propina: 0 });
    ventaModel.buscarPorId.mockResolvedValue({ id: 2, comanda_id: 1, total: 2000, propina: 0 });
    pagoModel.listarPorVenta.mockResolvedValue([
      { id: 1, tipo_pago: 'efectivo', monto: 1000 },
      { id: 2, tipo_pago: 'tarjeta', monto: 1000 },
    ]);
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', GARZON())
      .send({ comanda_id: 1, pagos: [{ tipo_pago: 'efectivo', monto: 1000 }, { tipo_pago: 'tarjeta', monto: 1000 }] });
    expect(res.status).toBe(201);
    expect(res.body.pagos).toHaveLength(2);
  });

  it('201 suma la propina al monto a pagar', async () => {
    comandaEntregadaTotal2000();
    ventaModel.crear.mockResolvedValue({ id: 3, comanda_id: 1, total: 2000, propina: 500 });
    ventaModel.buscarPorId.mockResolvedValue({ id: 3, comanda_id: 1, total: 2000, propina: 500 });
    pagoModel.listarPorVenta.mockResolvedValue([{ id: 1, tipo_pago: 'efectivo', monto: 2500 }]);
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', GARZON())
      .send({ comanda_id: 1, propina: 500, pagos: [{ tipo_pago: 'efectivo', monto: 2500 }] });
    expect(res.status).toBe(201);
  });

  it('409 si la comanda ya fue cobrada', async () => {
    comandaEntregadaTotal2000();
    ventaModel.crear.mockRejectedValue({ code: '23505' });
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', GARZON())
      .send({ comanda_id: 1, pagos: [{ tipo_pago: 'efectivo', monto: 2000 }] });
    expect(res.status).toBe(409);
  });
});
