'use strict';

const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../src/models/usuario.model');
const usuarioModel = require('../src/models/usuario.model');

const app = require('../src/app');

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 si faltan credenciales', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('401 si el usuario no existe', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'x@y.cl', password: '123456' });
    expect(res.status).toBe(401);
  });

  it('401 si la contraseña es incorrecta', async () => {
    const hash = await bcrypt.hash('correcta', 10);
    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 1, nombre: 'Admin', correo: 'a@a.cl', password_hash: hash, rol: 'administrador', estado: 'activo',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'a@a.cl', password: 'incorrecta' });
    expect(res.status).toBe(401);
  });

  it('403 si la cuenta está inactiva', async () => {
    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 1, nombre: 'Admin', correo: 'a@a.cl', password_hash: 'x', rol: 'garzon', estado: 'inactivo',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'a@a.cl', password: 'cualquiera' });
    expect(res.status).toBe(403);
  });

  it('200 y token si las credenciales son correctas', async () => {
    const hash = await bcrypt.hash('secret123', 10);
    usuarioModel.buscarPorCorreo.mockResolvedValue({
      id: 1, nombre: 'Admin', correo: 'a@a.cl', password_hash: hash, rol: 'administrador', estado: 'activo',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'a@a.cl', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario).toMatchObject({ id: 1, rol: 'administrador' });
    expect(res.body.usuario.password_hash).toBeUndefined();
  });
});
