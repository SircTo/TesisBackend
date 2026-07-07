'use strict';

const request = require('supertest');

jest.mock('../src/models/tipoCliente.model');
jest.mock('../src/models/trazabilidad.model');
const tipoClienteModel = require('../src/models/tipoCliente.model');

const app = require('../src/app');
const { tokenPara } = require('./helpers');

const ADMIN = () => `Bearer ${tokenPara('administrador')}`;
const GARZON = () => `Bearer ${tokenPara('garzon')}`;

describe('/api/tipos-cliente', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 sin token', async () => {
    const res = await request(app).get('/api/tipos-cliente');
    expect(res.status).toBe(401);
  });

  it('200 lista para usuario autenticado', async () => {
    tipoClienteModel.listar.mockResolvedValue([{ id: 1, nombre: 'Socio', porcentaje_descuento: '10.00', estado: 'activo' }]);
    const res = await request(app).get('/api/tipos-cliente').set('Authorization', GARZON());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('403 un garzón no puede crear tipos de cliente', async () => {
    const res = await request(app).post('/api/tipos-cliente').set('Authorization', GARZON()).send({ nombre: 'VIP' });
    expect(res.status).toBe(403);
  });

  it('400 al crear sin nombre', async () => {
    const res = await request(app).post('/api/tipos-cliente').set('Authorization', ADMIN()).send({ porcentaje_descuento: 10 });
    expect(res.status).toBe(400);
  });

  it('400 si el porcentaje está fuera de rango', async () => {
    const res = await request(app)
      .post('/api/tipos-cliente')
      .set('Authorization', ADMIN())
      .send({ nombre: 'VIP', porcentaje_descuento: 150 });
    expect(res.status).toBe(400);
  });

  it('201 el administrador crea un tipo de cliente', async () => {
    tipoClienteModel.crear.mockResolvedValue({ id: 1, nombre: 'VIP', porcentaje_descuento: '15.00', estado: 'activo' });
    const res = await request(app)
      .post('/api/tipos-cliente')
      .set('Authorization', ADMIN())
      .send({ nombre: 'VIP', porcentaje_descuento: 15 });
    expect(res.status).toBe(201);
  });

  it('409 si el nombre ya existe', async () => {
    tipoClienteModel.crear.mockRejectedValue({ code: '23505' });
    const res = await request(app).post('/api/tipos-cliente').set('Authorization', ADMIN()).send({ nombre: 'Socio' });
    expect(res.status).toBe(409);
  });
});
