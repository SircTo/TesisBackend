'use strict';

const request = require('supertest');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn(), query: jest.fn(), on: jest.fn(), end: jest.fn() },
  withTransaction: (cb) => cb({ query: jest.fn().mockResolvedValue({ rows: [] }) }),
  testConnection: jest.fn(),
}));
jest.mock('../src/models/comanda.model');
jest.mock('../src/models/comandaDetalle.model');
jest.mock('../src/models/mesa.model');
jest.mock('../src/models/producto.model');
jest.mock('../src/models/tipoCliente.model');
jest.mock('../src/models/movimientoStock.model');
jest.mock('../src/models/avisoStock.model');
jest.mock('../src/models/trazabilidad.model');

const comandaModel = require('../src/models/comanda.model');
const detalleModel = require('../src/models/comandaDetalle.model');
const mesaModel = require('../src/models/mesa.model');
const productoModel = require('../src/models/producto.model');
const avisoModel = require('../src/models/avisoStock.model');

const app = require('../src/app');
const { tokenPara } = require('./helpers');

const GARZON = () => `Bearer ${tokenPara('garzon')}`;
const COCINA = () => `Bearer ${tokenPara('jefe_cocina')}`;
const ADMIN = () => `Bearer ${tokenPara('administrador')}`;

describe('/api/comandas', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 sin token', async () => {
    const res = await request(app).get('/api/comandas');
    expect(res.status).toBe(401);
  });

  it('403 el jefe de cocina no puede crear comandas', async () => {
    const res = await request(app).post('/api/comandas').set('Authorization', COCINA()).send({ mesa_id: 1 });
    expect(res.status).toBe(403);
  });

  it('400 al crear sin mesa_id', async () => {
    const res = await request(app).post('/api/comandas').set('Authorization', GARZON()).send({});
    expect(res.status).toBe(400);
  });

  it('201 el garzón crea una comanda', async () => {
    mesaModel.buscarPorId.mockResolvedValue({ id: 1, numero: 1, zona_id: 1, estado: 'libre' });
    comandaModel.crear.mockResolvedValue({ id: 1, mesa_id: 1, estado: 'abierta', descuento_tipo_cliente_porcentaje: null });
    comandaModel.buscarPorId.mockResolvedValue({ id: 1, mesa_id: 1, estado: 'abierta', descuento_tipo_cliente_porcentaje: null });
    detalleModel.listarPorComanda.mockResolvedValue([]);
    const res = await request(app).post('/api/comandas').set('Authorization', GARZON()).send({ mesa_id: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, estado: 'abierta' });
    expect(res.body.resumen).toEqual({ subtotal: 0, descuento_tipo_cliente: 0, total: 0 });
  });

  it('409 si la mesa ya tiene una comanda activa', async () => {
    mesaModel.buscarPorId.mockResolvedValue({ id: 1 });
    comandaModel.crear.mockRejectedValue({ code: '23505' });
    const res = await request(app).post('/api/comandas').set('Authorization', GARZON()).send({ mesa_id: 1 });
    expect(res.status).toBe(409);
  });

  describe('items', () => {
    it('409 al agregar producto a una comanda no abierta', async () => {
      comandaModel.buscarPorId.mockResolvedValue({ id: 1, estado: 'entregada' });
      const res = await request(app)
        .post('/api/comandas/1/items')
        .set('Authorization', GARZON())
        .send({ producto_id: 1, cantidad: 1 });
      expect(res.status).toBe(409);
    });

    it('409 al agregar producto con stock insuficiente', async () => {
      comandaModel.buscarPorId.mockResolvedValue({ id: 1, estado: 'abierta' });
      productoModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Café', precio: 1000, stock: 1, disponibilidad: true, estado: 'activo' });
      const res = await request(app)
        .post('/api/comandas/1/items')
        .set('Authorization', GARZON())
        .send({ producto_id: 1, cantidad: 5 });
      expect(res.status).toBe(409);
    });

    it('201 al agregar un producto disponible con stock suficiente', async () => {
      comandaModel.buscarPorId.mockResolvedValue({ id: 1, estado: 'abierta', descuento_tipo_cliente_porcentaje: null });
      productoModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Café', precio: 1000, stock: 10, disponibilidad: true, estado: 'activo' });
      detalleModel.agregar.mockResolvedValue({ id: 1 });
      detalleModel.listarPorComanda.mockResolvedValue([
        { id: 1, producto_id: 1, producto_nombre: 'Café', cantidad: 2, precio_unitario: 1000, descuento_porcentaje: '0' },
      ]);
      const res = await request(app)
        .post('/api/comandas/1/items')
        .set('Authorization', GARZON())
        .send({ producto_id: 1, cantidad: 2 });
      expect(res.status).toBe(201);
      expect(res.body.resumen.total).toBe(2000);
    });
  });

  describe('cambio de estado', () => {
    it('409 ante una transición no permitida (abierta → entregada)', async () => {
      comandaModel.buscarPorId.mockResolvedValue({ id: 1, estado: 'abierta' });
      const res = await request(app).patch('/api/comandas/1/estado').set('Authorization', GARZON()).send({ estado: 'entregada' });
      expect(res.status).toBe(409);
    });

    it('200 al confirmar (abierta → en_preparacion) con stock suficiente', async () => {
      comandaModel.buscarPorId.mockResolvedValue({ id: 1, estado: 'abierta', descuento_tipo_cliente_porcentaje: null });
      detalleModel.listarPorComanda.mockResolvedValue([
        { id: 1, producto_id: 1, producto_nombre: 'Café', cantidad: 2, precio_unitario: 1000, descuento_porcentaje: '0' },
      ]);
      productoModel.ajustarStock.mockResolvedValue({ id: 1, stock: 8, stock_minimo: 5 });
      avisoModel.buscarPendiente.mockResolvedValue(null);
      const res = await request(app).patch('/api/comandas/1/estado').set('Authorization', GARZON()).send({ estado: 'en_preparacion' });
      expect(res.status).toBe(200);
    });

    it('409 al confirmar si el stock es insuficiente', async () => {
      comandaModel.buscarPorId.mockResolvedValue({ id: 1, estado: 'abierta' });
      detalleModel.listarPorComanda.mockResolvedValue([
        { id: 1, producto_id: 1, producto_nombre: 'Café', cantidad: 99, precio_unitario: 1000, descuento_porcentaje: '0' },
      ]);
      productoModel.ajustarStock.mockResolvedValue(null); // el UPDATE no afectó filas (stock insuficiente)
      const res = await request(app).patch('/api/comandas/1/estado').set('Authorization', GARZON()).send({ estado: 'en_preparacion' });
      expect(res.status).toBe(409);
    });
  });

  it('403 un garzón no puede anular una comanda', async () => {
    const res = await request(app).post('/api/comandas/1/anular').set('Authorization', GARZON());
    expect(res.status).toBe(403);
  });
});
