'use strict';

const request = require('supertest');

jest.mock('../src/models/avisoStock.model');
const avisoModel = require('../src/models/avisoStock.model');

const app = require('../src/app');
const { tokenPara } = require('./helpers');

describe('/api/avisos-stock', () => {
  beforeEach(() => jest.clearAllMocks());

  it('403 un garzón no puede consultar avisos', async () => {
    const res = await request(app).get('/api/avisos-stock').set('Authorization', `Bearer ${tokenPara('garzon')}`);
    expect(res.status).toBe(403);
  });

  it('200 el administrador consulta avisos', async () => {
    avisoModel.listar.mockResolvedValue([
      { id: 1, producto_id: 1, stock_al_generar: 2, estado: 'pendiente', created_at: 'x', resuelto_at: null },
    ]);
    const res = await request(app).get('/api/avisos-stock').set('Authorization', `Bearer ${tokenPara('administrador')}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('400 si el filtro estado no es válido', async () => {
    const res = await request(app)
      .get('/api/avisos-stock?estado=xxx')
      .set('Authorization', `Bearer ${tokenPara('jefe_cocina')}`);
    expect(res.status).toBe(400);
  });
});
