'use strict';

const request = require('supertest');

// Mock de la capa de datos y de la transacción (no se conecta a la base real).
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn(), query: jest.fn(), on: jest.fn(), end: jest.fn() },
  withTransaction: (cb) => cb({ query: jest.fn().mockResolvedValue({ rows: [] }) }),
  testConnection: jest.fn(),
}));
jest.mock('../src/models/producto.model');
jest.mock('../src/models/categoria.model');
jest.mock('../src/models/movimientoStock.model');
jest.mock('../src/models/avisoStock.model');
jest.mock('../src/models/trazabilidad.model');

const productoModel = require('../src/models/producto.model');
const categoriaModel = require('../src/models/categoria.model');
const avisoModel = require('../src/models/avisoStock.model');
const movimientoModel = require('../src/models/movimientoStock.model');

const app = require('../src/app');
const { tokenPara } = require('./helpers');

const COCINA = () => `Bearer ${tokenPara('jefe_cocina')}`;
const GARZON = () => `Bearer ${tokenPara('garzon')}`;

describe('/api/productos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 sin token', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
  });

  it('200 lista el arreglo completo cuando no se pide paginación (uso de catálogos)', async () => {
    productoModel.listar.mockResolvedValue([{ id: 1, nombre: 'Café' }]);
    const res = await request(app).get('/api/productos').set('Authorization', GARZON());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(productoModel.listar).toHaveBeenCalledWith({});
  });

  it('200 pagina y filtra por nombre cuando se envían page/pageSize', async () => {
    productoModel.listar.mockResolvedValue({ data: [{ id: 1, nombre: 'Café' }], total: 1, page: 1, pageSize: 20 });
    const res = await request(app)
      .get('/api/productos?page=1&pageSize=20&nombre=caf')
      .set('Authorization', GARZON());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, pageSize: 20 });
    expect(productoModel.listar).toHaveBeenCalledWith({ nombre: 'caf', page: 1, pageSize: 20 });
  });

  it('403 un garzón no puede crear productos', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', GARZON())
      .send({ nombre: 'Café', precio: 1500, area: 'barra' });
    expect(res.status).toBe(403);
  });

  it('400 al crear sin precio ni área', async () => {
    const res = await request(app).post('/api/productos').set('Authorization', COCINA()).send({ nombre: 'Café' });
    expect(res.status).toBe(400);
  });

  it('201 el jefe de cocina crea un producto', async () => {
    categoriaModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Bebestibles' });
    productoModel.crear.mockResolvedValue({
      id: 1, nombre: 'Café', categoria_id: 1, precio: 1500, stock: 10, stock_minimo: 5,
      disponibilidad: true, area: 'barra', estado: 'activo',
    });
    avisoModel.buscarPendiente.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', COCINA())
      .send({ nombre: 'Café', categoria_id: 1, precio: 1500, stock: 10, stock_minimo: 5, area: 'barra' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nombre: 'Café', stock: 10 });
  });

  it('400 al crear con categoría inexistente', async () => {
    categoriaModel.buscarPorId.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', COCINA())
      .send({ nombre: 'Café', categoria_id: 999, precio: 1500, area: 'barra' });
    expect(res.status).toBe(400);
  });

  describe('POST /:id/stock (ajuste de stock)', () => {
    it('400 si cantidad es 0', async () => {
      productoModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Café', stock: 10, stock_minimo: 5 });
      const res = await request(app).post('/api/productos/1/stock').set('Authorization', COCINA()).send({ cantidad: 0 });
      expect(res.status).toBe(400);
    });

    it('200 al ajustar el stock correctamente', async () => {
      productoModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Café', stock: 10, stock_minimo: 5 });
      productoModel.ajustarStock.mockResolvedValue({ id: 1, nombre: 'Café', stock: 15, stock_minimo: 5 });
      avisoModel.buscarPendiente.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/productos/1/stock')
        .set('Authorization', COCINA())
        .send({ cantidad: 5, motivo: 'Reposición' });
      expect(res.status).toBe(200);
      expect(res.body.stock).toBe(15);
    });

    it('400 si el ajuste dejaría el stock en negativo', async () => {
      productoModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Café', stock: 3, stock_minimo: 5 });
      productoModel.ajustarStock.mockResolvedValue(null); // el UPDATE no afectó filas
      const res = await request(app)
        .post('/api/productos/1/stock')
        .set('Authorization', COCINA())
        .send({ cantidad: -10 });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /revision (revisión de inventario)', () => {
    it('200 corrige los productos con diferencia', async () => {
      productoModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Café', stock: 8, stock_minimo: 2 });
      productoModel.ajustarStock.mockResolvedValue({ id: 1, nombre: 'Café', stock: 5, stock_minimo: 2 });
      avisoModel.buscarPendiente.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/productos/revision')
        .set('Authorization', COCINA())
        .send({ items: [{ producto_id: 1, stock_real: 5 }] });
      expect(res.status).toBe(200);
      expect(res.body.corregidos).toBe(1);
    });

    it('200 sin cambios cuando el stock coincide', async () => {
      productoModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Café', stock: 8, stock_minimo: 2 });
      const res = await request(app)
        .post('/api/productos/revision')
        .set('Authorization', COCINA())
        .send({ items: [{ producto_id: 1, stock_real: 8 }] });
      expect(res.status).toBe(200);
      expect(res.body.corregidos).toBe(0);
    });

    it('403 un garzón no puede revisar inventario', async () => {
      const res = await request(app)
        .post('/api/productos/revision')
        .set('Authorization', GARZON())
        .send({ items: [{ producto_id: 1, stock_real: 5 }] });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /:id/movimientos (historial de stock, paginado)', () => {
    it('200 devuelve el historial paginado con valores por defecto', async () => {
      productoModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Café' });
      movimientoModel.listarPorProducto.mockResolvedValue({
        data: [{ id: 1, tipo: 'ajuste', cantidad: 5, usuario: 'Admin' }],
        total: 1,
        page: 1,
        pageSize: 20,
      });
      const res = await request(app).get('/api/productos/1/movimientos').set('Authorization', GARZON());
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total: 1, page: 1, pageSize: 20 });
      expect(movimientoModel.listarPorProducto).toHaveBeenCalledWith(1, { page: 1, pageSize: 20 });
    });

    it('200 respeta page/pageSize enviados', async () => {
      productoModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Café' });
      movimientoModel.listarPorProducto.mockResolvedValue({ data: [], total: 0, page: 2, pageSize: 10 });
      const res = await request(app)
        .get('/api/productos/1/movimientos?page=2&pageSize=10')
        .set('Authorization', GARZON());
      expect(res.status).toBe(200);
      expect(movimientoModel.listarPorProducto).toHaveBeenCalledWith(1, { page: 2, pageSize: 10 });
    });

    it('404 si el producto no existe', async () => {
      productoModel.buscarPorId.mockResolvedValue(null);
      const res = await request(app).get('/api/productos/999/movimientos').set('Authorization', GARZON());
      expect(res.status).toBe(404);
    });
  });
});
