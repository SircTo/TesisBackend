-- 005_comandas.sql
-- Comandas y su detalle de productos (RF_07 a RF_15).

CREATE TABLE comandas (
  id              SERIAL PRIMARY KEY,
  mesa_id         INTEGER     NOT NULL REFERENCES mesas(id),
  tipo_cliente_id INTEGER     REFERENCES tipos_cliente(id),
  usuario_id      INTEGER     NOT NULL REFERENCES usuarios(id),   -- garzón que la creó
  estado          VARCHAR(20) NOT NULL DEFAULT 'abierta'
                    CHECK (estado IN ('abierta', 'en_preparacion', 'entregada', 'pagada', 'anulada')),
  -- Copia del % de descuento del tipo de cliente al momento de aplicarlo.
  -- NULL si la comanda no tiene tipo de cliente asociado.
  descuento_tipo_cliente_porcentaje NUMERIC(5,2)
                    CHECK (descuento_tipo_cliente_porcentaje IS NULL
                           OR (descuento_tipo_cliente_porcentaje >= 0
                               AND descuento_tipo_cliente_porcentaje <= 100)),
  propina         INTEGER     NOT NULL DEFAULT 0 CHECK (propina >= 0),
  observaciones   VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Regla RF_07: una mesa no puede tener más de una comanda activa a la vez.
-- Se consideran "activas" las comandas no pagadas ni anuladas
-- (abierta, en_preparacion o entregada).
CREATE UNIQUE INDEX uq_comanda_activa_por_mesa
  ON comandas (mesa_id)
  WHERE estado IN ('abierta', 'en_preparacion', 'entregada');

CREATE TABLE comanda_detalle (
  id                   SERIAL PRIMARY KEY,
  comanda_id           INTEGER      NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  producto_id          INTEGER      NOT NULL REFERENCES productos(id),
  cantidad             INTEGER      NOT NULL CHECK (cantidad > 0),
  precio_unitario      INTEGER      NOT NULL CHECK (precio_unitario >= 0), -- copia del precio al momento
  descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0
                         CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
  observaciones        VARCHAR(255)
);
