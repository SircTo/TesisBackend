-- 001_usuarios.sql
-- Usuarios del sistema y sus roles (RF_01, RF_02).

CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  correo        VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(20)  NOT NULL CHECK (rol IN ('administrador', 'garzon', 'jefe_cocina')),
  estado        VARCHAR(10)  NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
