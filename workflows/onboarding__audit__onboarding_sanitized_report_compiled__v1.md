# Workflow `onboarding__audit__onboarding_sanitized_report_compiled__v1`

## Objetivo

Consolidar un informe sanitario final del bloque de onboarding, reuniendo los resultados de los checks previos bajo el mismo `correlation_id`.

## Trigger

- tipo recomendado: `Execute Workflow`
- origen esperado: despues de `onboarding_dispatch_health_checked`

## Input esperado

- contrato comun definido en `n8n/docs/onboarding_audit_sequence.md`
- referencias sanitarias a los checks anteriores

## Logica esperada

- compilar un resumen final con:
  - `correlation_id`
  - lista de checks ejecutados
  - resultado de cada check
  - `next_action` humana sugerida

No debe mutar tablas de negocio. Solo consolidar evidencia tecnica.

## Output esperado

```json
{
  "workflow_name": "onboarding_sanitized_report_compiled",
  "workflow_version": "v1",
  "correlation_id": "uuid",
  "cliente_id": "uuid",
  "check_name": "sanitized_report_compiled",
  "check_status": "completed",
  "result_summary": "Secuencia de auditoria post-onboarding consolidada",
  "next_action": "Lista para futura ampliacion funcional de bajo riesgo",
  "output_payload": {
    "checks": [
      "onboarding_trace_verified",
      "onboarding_readiness_revalidated",
      "onboarding_credentials_metadata_checked",
      "onboarding_dispatch_health_checked"
    ],
    "all_checks_passed": true
  }
}
```

## Sistemas afectados

- escritura tecnica en `ejecuciones_workflows`

## Riesgos

- muy bajo,
- si en el futuro se desea persistir el informe fuera de `ejecuciones_workflows`, ese cambio debe documentarse aparte.

## Idempotencia

- clave recomendada: `onboarding_sanitized_report_compiled + correlation_id`

## Validacion esperada

- fila tecnica en `ejecuciones_workflows`
- `output_payload.all_checks_passed = true`
