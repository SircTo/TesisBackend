'use strict';

const request = require('supertest');

jest.mock('../src/models/zona.model');
jest.mock('../src/models/trazabilidad.model');
const zonaModel = require('../src/models/zona.model');

const app = require('../src/app');
const { tokenPara } = require('./helpers');

const ADMIN = () => `Bearer ${tokenPara('administrador')}`;
const GARZON = () => `Bearer ${tokenPara('garzon')}`;

describe('/api/zonas', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 sin token', async () => {
    const res = await request(app).get('/api/zonas');
    expect(res.status).toBe(401);
  });

  it('200 cualquier usuario autenticado puede listar', async () => {
    zonaModel.listar.mockResolvedValue([{ id: 1, nombre: 'Salón', descripcion: null, estado: 'activo' }]);
    const res = await request(app).get('/api/zonas').set('Authorization', GARZON());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('403 un garzón no puede crear zonas', async () => {
    const res = await request(app)
      .post('/api/zonas')
      .set('Authorization', GARZON())
      .send({ nombre: 'Terraza' });
    expect(res.status).toBe(403);
  });

  it('400 crear sin nombre', async () => {
    const res = await request(app).post('/api/zonas').set('Authorization', ADMIN()).send({});
    expect(res.status).toBe(400);
  });

  it('201 el administrador crea una zona', async () => {
    zonaModel.crear.mockResolvedValue({ id: 1, nombre: 'Salón', descripcion: 'Planta baja', estado: 'activo' });
    const res = await request(app)
      .post('/api/zonas')
      .set('Authorization', ADMIN())
      .send({ nombre: 'Salón', descripcion: 'Planta baja' });
    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe('Salón');
  });

  it('404 al obtener una zona inexistente', async () => {
    zonaModel.buscarPorId.mockResolvedValue(null);
    const res = await request(app).get('/api/zonas/999').set('Authorization', ADMIN());
    expect(res.status).toBe(404);
  });
});
