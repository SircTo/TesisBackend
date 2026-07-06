'use strict';

const request = require('supertest');

jest.mock('../src/models/categoria.model');
jest.mock('../src/models/trazabilidad.model');
const categoriaModel = require('../src/models/categoria.model');

const app = require('../src/app');
const { tokenPara } = require('./helpers');

const ADMIN = () => `Bearer ${tokenPara('administrador')}`;
const GARZON = () => `Bearer ${tokenPara('garzon')}`;

describe('/api/categorias', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 sin token', async () => {
    const res = await request(app).get('/api/categorias');
    expect(res.status).toBe(401);
  });

  it('200 lista para usuario autenticado', async () => {
    categoriaModel.listar.mockResolvedValue([{ id: 1, nombre: 'Bebestibles', estado: 'activo' }]);
    const res = await request(app).get('/api/categorias').set('Authorization', GARZON());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('403 un garzón no puede crear categorías', async () => {
    const res = await request(app).post('/api/categorias').set('Authorization', GARZON()).send({ nombre: 'X' });
    expect(res.status).toBe(403);
  });

  it('201 el administrador crea una categoría', async () => {
    categoriaModel.crear.mockResolvedValue({ id: 1, nombre: 'Postres', estado: 'activo' });
    const res = await request(app).post('/api/categorias').set('Authorization', ADMIN()).send({ nombre: 'Postres' });
    expect(res.status).toBe(201);
  });

  it('409 si el nombre de categoría ya existe', async () => {
    categoriaModel.crear.mockRejectedValue({ code: '23505' });
    const res = await request(app).post('/api/categorias').set('Authorization', ADMIN()).send({ nombre: 'Postres' });
    expect(res.status).toBe(409);
  });
});
