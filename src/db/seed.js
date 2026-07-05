'use strict';

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// Credenciales del administrador inicial. Se pueden sobreescribir con variables
// de entorno; si no, se usan estos valores por defecto (¡cambiar la contraseña luego!).
const ADMIN_NOMBRE = process.env.ADMIN_NOMBRE || 'Administrador';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sjmr.cl';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Usuario administrador
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await client.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol)
       VALUES ($1, $2, $3, 'administrador')
       ON CONFLICT (correo) DO NOTHING`,
      [ADMIN_NOMBRE, ADMIN_EMAIL, passwordHash]
    );

    // 2) Categorías básicas de productos
    const categorias = ['Entradas', 'Platos de fondo', 'Bebestibles', 'Postres'];
    for (const nombre of categorias) {
      await client.query(
        'INSERT INTO categorias (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING',
        [nombre]
      );
    }

    // 3) Tipos de cliente de ejemplo
    await client.query(
      `INSERT INTO tipos_cliente (nombre, porcentaje_descuento) VALUES
         ('General', 0),
         ('Socio', 10)
       ON CONFLICT (nombre) DO NOTHING`
    );

    await client.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log('[seed] Datos iniciales insertados.');
    // eslint-disable-next-line no-console
    console.log(`[seed] Admin -> correo: ${ADMIN_EMAIL} | contraseña: ${ADMIN_PASSWORD} (cámbiala pronto)`);
  } catch (err) {
    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('[seed] Error:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
