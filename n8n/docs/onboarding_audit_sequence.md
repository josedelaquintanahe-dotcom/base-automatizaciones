# Onboarding Audit Sequence

## Proposito

Definir la siguiente secuencia de 5 workflows de n8n de bajo riesgo despues de `onboarding_activated`, reutilizando el patron de trazabilidad ya validado en el proyecto.

## Principios

- no introducir efectos externos irreversibles,
- no requerir credenciales nuevas si no son estrictamente necesarias,
- reutilizar `correlation_id` extremo a extremo,
- persistir solo informacion sanitaria y verificable,
- poder validarse con smoke tests o consultas tecnicas simples.

## Contrato tecnico comun

### Input minimo comun

```json
{
  "workflow_name": "onboarding_activated",
  "version": "v1",
  "correlation_id": "uuid",
  "cliente_id": "uuid",
  "timestamp": "2026-04-29T10:00:00.000Z",
  "source": "backoffice_activation",
  "onboarding_status": "listo_para_automatizar",
  "client_summary": {
    "id": "uuid",
    "nombre_empresa": "Empresa Test",
    "plan": "profesional",
    "estado": "activo"
  },
  "automation_readiness": {
    "ready": true,
    "missing_requirements": [],
    "next_recommended_action": "texto"
  },
  "operational_summary": {
    "credenciales_activas": 2,
    "tipos_credencial": ["gmail", "api"],
    "token_operativo_activo": true,
    "factura_inicial_emitida": true
  }
}
```

### Output sanitario comun

```json
{
  "workflow_name": "onboarding_trace_verified",
  "workflow_version": "v1",
  "correlation_id": "uuid",
  "cliente_id": "uuid",
  "check_name": "nombre_del_check",
  "check_status": "completed",
  "result_summary": "texto breve",
  "next_action": "texto breve o null",
  "output_payload": {
    "sanitized": true
  }
}
```

## Reglas comunes

- `check_status` debe limitarse a `received`, `completed` o `error`,
- `output_payload` no debe incluir secretos, tokens completos, ni `valor_encriptado`,
- cualquier lookup adicional debe usar tablas ya presentes y solo columnas necesarias,
- los workflows no deben mutar `clientes`, `facturas`, `tokens`, `credenciales_cliente` ni `automatizaciones` en esta fase,
- la idempotencia recomendada es `workflow_name + correlation_id`.

## Secuencia recomendada

1. `onboarding_trace_verified`
2. `onboarding_readiness_revalidated`
3. `onboarding_credentials_metadata_checked`
4. `onboarding_dispatch_health_checked`
5. `onboarding_sanitized_report_compiled`

## Matriz resumida

| Workflow | Trigger recomendado | Lecturas | Escrituras | Validacion minima |
| --- | --- | --- | --- | --- |
| `onboarding_trace_verified` | `Execute Workflow` desde `onboarding_activated` | `automation_events` | `ejecuciones_workflows` | confirmar evento `onboarding_activated` por `correlation_id` |
| `onboarding_readiness_revalidated` | `Execute Workflow` | payload sanitario recibido | `ejecuciones_workflows` | `ready = true` y `missing_requirements = []` |
| `onboarding_credentials_metadata_checked` | `Execute Workflow` | payload sanitario recibido | `ejecuciones_workflows` | `credenciales_activas > 0` y `token_operativo_activo = true` |
| `onboarding_dispatch_health_checked` | `Execute Workflow` | snapshot sanitario de `system/status` | `ejecuciones_workflows` | `configured = true` y `pathStatus = expected` |
| `onboarding_sanitized_report_compiled` | `Execute Workflow` | outputs sanitarios previos | `ejecuciones_workflows` | `all_checks_passed = true` |

## Query de validacion recomendada

```sql
SELECT
  workflow_name,
  correlation_id,
  status,
  started_at,
  finished_at
FROM public.ejecuciones_workflows
WHERE workflow_name IN (
  'onboarding_trace_verified',
  'onboarding_readiness_revalidated',
  'onboarding_credentials_metadata_checked',
  'onboarding_dispatch_health_checked',
  'onboarding_sanitized_report_compiled'
)
ORDER BY created_at DESC
LIMIT 50;
```

## Validacion esperada

- cada workflow debe poder registrar su propia fila tecnica en `ejecuciones_workflows`,
- el mismo `correlation_id` debe mantenerse en toda la secuencia,
- cada output debe ser trazable y sanitario,
- la secuencia completa debe seguir siendo compatible con `scripts/run-onboarding-operational-check.ps1`.
