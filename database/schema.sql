-- ============================================================================
-- Esquema de negocio base para el SaaS de automatizaciones
-- Compatible con Supabase / PostgreSQL
-- Archivo nuevo: no reemplaza ni modifica database/schema.md
-- ============================================================================

-- Asegura disponibilidad de gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Funcion reutilizable para mantener updated_at sincronizado en cada UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. clientes
-- Representa cada empresa cliente dentro del sistema SaaS.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa VARCHAR NOT NULL,
  email_contacto VARCHAR NOT NULL UNIQUE,
  telefono VARCHAR,
  plan VARCHAR NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'activo',
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  precio_mensual DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT clientes_plan_check
    CHECK (plan IN ('basico', 'profesional', 'empresarial')),
  CONSTRAINT clientes_estado_check
    CHECK (estado IN ('activo', 'suspendido'))
);

CREATE INDEX IF NOT EXISTS idx_clientes_email
  ON public.clientes (email_contacto);

-- ============================================================================
-- 2. credenciales_cliente
-- Almacena referencias a credenciales cifradas o protegidas por cliente.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credenciales_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo VARCHAR NOT NULL,
  nombre VARCHAR NOT NULL,
  valor_encriptado TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  ultima_verificacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credenciales_cliente
  ON public.credenciales_cliente (cliente_id);

-- ============================================================================
-- 3. automatizaciones
-- Catalogo de automatizaciones activas o pausadas por cliente.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automatizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  n8n_workflow_id VARCHAR NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'activo',
  frecuencia VARCHAR,
  ultima_ejecucion TIMESTAMPTZ,
  proxima_ejecucion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT automatizaciones_estado_check
    CHECK (estado IN ('activo', 'pausado', 'error')),
  CONSTRAINT automatizaciones_frecuencia_check
    CHECK (frecuencia IS NULL OR frecuencia IN ('manual', 'diaria', 'semanal', 'cada_hora'))
);

CREATE INDEX IF NOT EXISTS idx_automatizaciones_cliente
  ON public.automatizaciones (cliente_id);

-- ============================================================================
-- 4. ejecuciones
-- Historial de ejecuciones de cada automatizacion.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ejecuciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automatizacion_id UUID NOT NULL REFERENCES public.automatizaciones(id) ON DELETE CASCADE,
  estado VARCHAR NOT NULL,
  resultado TEXT,
  error_mensaje TEXT,
  fecha_ejecucion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  duracion_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ejecuciones_estado_check
    CHECK (estado IN ('exito', 'error', 'pendiente'))
);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_automatizacion
  ON public.ejecuciones (automatizacion_id);

-- ============================================================================
-- 5. facturas
-- Facturacion mensual y setup inicial por cliente.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  mes DATE NOT NULL,
  setup_inicial DECIMAL(10,2) DEFAULT 0,
  mantenimiento_mensual DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT facturas_estado_check
    CHECK (estado IN ('pendiente', 'pagada', 'cancelada'))
);

CREATE INDEX IF NOT EXISTS idx_facturas_cliente
  ON public.facturas (cliente_id);

-- ============================================================================
-- 6. tokens
-- Tokens internos o de integracion asociados a cada cliente.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  token_hash VARCHAR NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT true,
  expiracion DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tokens_cliente
  ON public.tokens (cliente_id);

-- ============================================================================
-- Triggers reutilizando public.set_updated_at() para tablas con updated_at
-- Se crean de forma idempotente comprobando pg_trigger.
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_clientes_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_clientes_set_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_credenciales_cliente_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_credenciales_cliente_set_updated_at
    BEFORE UPDATE ON public.credenciales_cliente
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_automatizaciones_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_automatizaciones_set_updated_at
    BEFORE UPDATE ON public.automatizaciones
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_facturas_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_facturas_set_updated_at
    BEFORE UPDATE ON public.facturas
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;
