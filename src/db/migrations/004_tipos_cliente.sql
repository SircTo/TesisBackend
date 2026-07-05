-- 004_tipos_cliente.sql
-- Tipos de cliente y su descuento asociado (RF_14, RF_16).

CREATE TABLE tipos_cliente (
  id                   SERIAL PRIMARY KEY,
  nombre               VARCHAR(80)  NOT NULL UNIQUE,
  porcentaje_descuento NUMERIC(5,2) NOT NULL DEFAULT 0
                         CHECK (porcentaje_descuento >= 0 AND porcentaje_descuento <= 100),
  estado               VARCHAR(10)  NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);
