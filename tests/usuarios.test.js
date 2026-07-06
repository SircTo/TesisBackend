'use strict';

const request = require('supertest');

jest.mock('../src/models/usuario.model');
jest.mock('../src/models/trazabilidad.model');
const usuarioModel = require('../src/models/usuario.model');

const app = require('../src/app');
const { tokenPara } = require('./helpers');

const ADMIN = () => `Bearer ${tokenPara('administrador')}`;

describe('/api/usuarios', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 sin token', async () => {
    const res = await request(app).get('/api/usuarios');
    expect(res.status).toBe(401);
  });

  it('403 si el rol no es administrador', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tokenPara('garzon')}`);
    expect(res.status).toBe(403);
  });

  it('200 lista para administrador', async () => {
    usuarioModel.listar.mockResolvedValue([
      { id: 1, nombre: 'Admin', correo: 'a@a.cl', rol: 'administrador', estado: 'activo' },
    ]);
    const res = await request(app).get('/api/usuarios').set('Authorization', ADMIN());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('400 al crear con datos inválidos', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', ADMIN())
      .send({ nombre: 'x' });
    expect(res.status).toBe(400);
  });

  it('201 al crear un usuario válido', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    usuarioModel.crear.mockResolvedValue({
      id: 2, nombre: 'Juan', correo: 'j@j.cl', rol: 'garzon', estado: 'activo',
    });
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', ADMIN())
      .send({ nombre: 'Juan', correo: 'j@j.cl', password: '123456', rol: 'garzon' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(2);
  });

  it('409 si el correo ya existe', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({ id: 9, correo: 'j@j.cl' });
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', ADMIN())
      .send({ nombre: 'Juan', correo: 'j@j.cl', password: '123456', rol: 'garzon' });
    expect(res.status).toBe(409);
  });
});
