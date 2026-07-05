'use strict';

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Crea la tabla que lleva el registro de las migraciones ya aplicadas.
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre     VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getApplied(client) {
  const { rows } = await client.query('SELECT nombre FROM schema_migrations');
  return new Set(rows.map((r) => r.nombre));
}

async function run() {
  const archivos = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // se aplican en orden alfabético (por eso van numeradas)

  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const aplicadas = await getApplied(client);

    let count = 0;
    for (const archivo of archivos) {
      if (aplicadas.has(archivo)) continue;

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, archivo), 'utf8');
      // eslint-disable-next-line no-console
      console.log(`[migrate] Aplicando ${archivo}...`);

      // Cada migración corre en su propia transacción: si falla, se revierte entera.
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [archivo]);
        await client.query('COMMIT');
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Fallo en ${archivo}: ${err.message}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log(count === 0 ? '[migrate] No hay migraciones pendientes.' : `[migrate] ${count} migración(es) aplicada(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[migrate] Error:', err.message);
  process.exit(1);
});
