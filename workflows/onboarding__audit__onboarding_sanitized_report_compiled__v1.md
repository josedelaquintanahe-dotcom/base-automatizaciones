# Workflow `onboarding__audit__onboarding_sanitized_report_compiled__v1`

## Objetivo

Consolidar un informe sanitario final del bloque de onboarding, reuniendo los resultados de los checks previos bajo el mismo `correlation_id`.

## Trigger

- tipo canonico: webhook `POST` interno/controlado
- ruta activa: `/webhook/onboarding_sanitized_report_compiled`
- origen esperado: script operativo o flujo tecnico derivado de `onboarding_activated`
- estado actual: blueprint SDK validado, workflow publicado en n8n Cloud (`RBItrrOrI3M7OFyU`) y validado en ejecucion real el 29 de abril de 2026

## Input esperado

- payload minimo:
  - `correlation_id`
  - `cliente_id`

## Logica esperada

- compilar un resumen final con:
  - `correlation_id`
  - lista de checks ejecutados
  - resultado de cada check
  - `next_action` humana sugerida

- leer desde `ejecuciones_workflows` los workflows:
  - `onboarding_trace_verified`
  - `onboarding_readiness_revalidated`
  - `onboarding_credentials_metadata_checked`
  - `onboarding_dispatch_health_checked`

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
  "sanitized_result": {
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

- lectura de `ejecuciones_workflows`
- escritura tecnica en `ejecuciones_workflows`

## Riesgos

- muy bajo,
- si en el futuro se desea persistir el informe fuera de `ejecuciones_workflows`, ese cambio debe documentarse aparte.

## Idempotencia

- clave recomendada: `onboarding_sanitized_report_compiled + correlation_id`

## Validacion esperada

- fila tecnica en `ejecuciones_workflows`
- `sanitized_result.all_checks_passed = true`

## Validacion tecnica ya realizada

- validacion SDK oficial de n8n: correcta
- prueba segura con datos fijados en n8n Cloud: correcta
- script operativo preparado para validacion real: `scripts/verify-onboarding-report-workflow.ps1`
- validacion en ejecucion real con trazabilidad por `correlation_id`: correcta
