CREATE TABLE IF NOT EXISTS public.ejecuciones_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name VARCHAR NOT NULL,
  execution_source VARCHAR NOT NULL,
  correlation_id VARCHAR,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  status VARCHAR NOT NULL,
  input_payload JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ejecuciones_workflows_status_check
    CHECK (status IN ('received', 'completed', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_workflows_workflow_name
  ON public.ejecuciones_workflows (workflow_name);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_workflows_correlation
  ON public.ejecuciones_workflows (correlation_id);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_workflows_cliente
  ON public.ejecuciones_workflows (cliente_id);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_workflows_created_at
  ON public.ejecuciones_workflows (created_at DESC);
