-- 002_zonas_mesas.sql
-- Distribución del local: zonas y mesas (RF_03, RF_04).

CREATE TABLE zonas (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(80)  NOT NULL,
  descripcion VARCHAR(255),
  estado      VARCHAR(10)  NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE TABLE mesas (
  id      SERIAL PRIMARY KEY,
  numero  INTEGER     NOT NULL,
  zona_id INTEGER     NOT NULL REFERENCES zonas(id),
  estado  VARCHAR(10) NOT NULL DEFAULT 'libre' CHECK (estado IN ('libre', 'ocupada', 'pagando')),
  -- No puede repetirse el mismo número de mesa dentro de una zona.
  UNIQUE (zona_id, numero)
);
