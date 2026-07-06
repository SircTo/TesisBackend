'use strict';

const request = require('supertest');

jest.mock('../src/models/mesa.model');
jest.mock('../src/models/zona.model');
jest.mock('../src/models/trazabilidad.model');
const mesaModel = require('../src/models/mesa.model');
const zonaModel = require('../src/models/zona.model');

const app = require('../src/app');
const { tokenPara } = require('./helpers');

const ADMIN = () => `Bearer ${tokenPara('administrador')}`;
const GARZON = () => `Bearer ${tokenPara('garzon')}`;

describe('/api/mesas', () => {
  beforeEach(() => jest.clearAllMocks());

  it('403 un garzón no puede crear mesas', async () => {
    const res = await request(app)
      .post('/api/mesas')
      .set('Authorization', GARZON())
      .send({ numero: 1, zona_id: 1 });
    expect(res.status).toBe(403);
  });

  it('400 si zona_id del filtro no es válido', async () => {
    const res = await request(app).get('/api/mesas?zona_id=abc').set('Authorization', ADMIN());
    expect(res.status).toBe(400);
  });

  it('201 crea una mesa en una zona existente', async () => {
    zonaModel.buscarPorId.mockResolvedValue({ id: 1, nombre: 'Salón' });
    mesaModel.crear.mockResolvedValue({ id: 1, numero: 1, zona_id: 1, estado: 'libre' });
    const res = await request(app)
      .post('/api/mesas')
      .set('Authorization', ADMIN())
      .send({ numero: 1, zona_id: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ numero: 1, zona_id: 1, estado: 'libre' });
  });

  it('404 si la zona no existe', async () => {
    zonaModel.buscarPorId.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/mesas')
      .set('Authorization', ADMIN())
      .send({ numero: 1, zona_id: 999 });
    expect(res.status).toBe(404);
  });

  it('409 si el número de mesa ya existe en la zona', async () => {
    zonaModel.buscarPorId.mockResolvedValue({ id: 1 });
    mesaModel.crear.mockRejectedValue({ code: '23505' });
    const res = await request(app)
      .post('/api/mesas')
      .set('Authorization', ADMIN())
      .send({ numero: 1, zona_id: 1 });
    expect(res.status).toBe(409);
  });
});
