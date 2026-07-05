-- 007_trazabilidad.sql
-- Historial de acciones realizadas por los usuarios (RF_24, IS_06).

CREATE TABLE trazabilidad (
  id         SERIAL PRIMARY KEY,
  usuario_id INTEGER     REFERENCES usuarios(id), -- puede ser NULL si el usuario se elimina
  accion     VARCHAR(20) NOT NULL,                -- crear, modificar, anular, registrar...
  entidad    VARCHAR(40) NOT NULL,                -- tabla afectada: comandas, productos, ventas...
  entidad_id INTEGER,                             -- id del registro afectado
  detalle    TEXT,                                -- descripción libre del movimiento
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trazabilidad_usuario ON trazabilidad (usuario_id);
CREATE INDEX idx_trazabilidad_entidad ON trazabilidad (entidad, entidad_id);
