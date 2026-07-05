-- 006_ventas_pagos.sql
-- Ventas y pagos (RF_19, RF_20, RF_21).

CREATE TABLE ventas (
  id              SERIAL PRIMARY KEY,
  comanda_id      INTEGER     NOT NULL UNIQUE REFERENCES comandas(id), -- una venta por comanda
  usuario_id      INTEGER     NOT NULL REFERENCES usuarios(id),        -- quien registró el cobro
  subtotal        INTEGER     NOT NULL CHECK (subtotal >= 0),
  descuento_total INTEGER     NOT NULL DEFAULT 0 CHECK (descuento_total >= 0),
  propina         INTEGER     NOT NULL DEFAULT 0 CHECK (propina >= 0),
  total           INTEGER     NOT NULL CHECK (total >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Una venta puede tener varios pagos (RF_20: pago dividido entre tipos de pago).
CREATE TABLE pagos (
  id        SERIAL PRIMARY KEY,
  venta_id  INTEGER     NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  tipo_pago VARCHAR(20) NOT NULL CHECK (tipo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
  monto     INTEGER     NOT NULL CHECK (monto > 0)
);
