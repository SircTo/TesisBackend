-- 003_categorias_productos.sql
-- Inventario: categorías, productos, movimientos de stock y avisos de stock
-- (RF_05, RF_06, RF_17, RF_18).

CREATE TABLE categorias (
  id     SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE TABLE productos (
  id                   SERIAL PRIMARY KEY,
  nombre               VARCHAR(120) NOT NULL,
  categoria_id         INTEGER      REFERENCES categorias(id),
  precio               INTEGER      NOT NULL CHECK (precio >= 0),        -- pesos chilenos
  stock                INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo         INTEGER      NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  disponibilidad       BOOLEAN      NOT NULL DEFAULT true,
  area                 VARCHAR(10)  NOT NULL CHECK (area IN ('cocina', 'barra')),
  estado               VARCHAR(10)  NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Registra cada cambio de stock indicando el usuario responsable y el motivo (RF_17).
CREATE TABLE movimientos_stock (
  id          SERIAL PRIMARY KEY,
  producto_id INTEGER     NOT NULL REFERENCES productos(id),
  usuario_id  INTEGER     NOT NULL REFERENCES usuarios(id),
  tipo        VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'ajuste', 'venta')),
  cantidad    INTEGER     NOT NULL,  -- positivo suma stock, negativo lo descuenta
  motivo      VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Avisos generados cuando el stock de un producto llega a su mínimo (RF_18).
-- Se crean desde la lógica de la aplicación al detectar stock <= stock_minimo,
-- y se marcan como 'resuelto' cuando el stock vuelve sobre el mínimo.
CREATE TABLE avisos_stock (
  id               SERIAL PRIMARY KEY,
  producto_id      INTEGER     NOT NULL REFERENCES productos(id),
  stock_al_generar INTEGER     NOT NULL,  -- stock que tenía el producto al dispararse el aviso
  estado           VARCHAR(10) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'resuelto')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  resuelto_at      TIMESTAMPTZ           -- NULL mientras siga pendiente
);

-- Evita duplicar avisos: un producto no puede tener dos avisos pendientes a la vez.
CREATE UNIQUE INDEX uq_aviso_stock_pendiente
  ON avisos_stock (producto_id)
  WHERE estado = 'pendiente';
