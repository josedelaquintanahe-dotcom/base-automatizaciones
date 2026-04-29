# Workflow `onboarding__audit__onboarding_dispatch_health_checked__v1`

## Objetivo

Dejar evidencia tecnica de que el backend sigue exponiendo un estado seguro de dispatch para onboarding (`configured = true` y `pathStatus = expected`).

## Trigger

- tipo canonico: webhook `POST` interno/controlado
- ruta activa: `/webhook/onboarding_dispatch_health_checked`
- origen esperado: script operativo o flujo tecnico derivado de `onboarding_activated`
- estado actual: blueprint SDK validado, workflow publicado en n8n Cloud (`az9xt6p2FnwDCEsF`) y validado en ejecucion real el 29 de abril de 2026

## Input esperado

- payload minimo:
  - `correlation_id`
  - `cliente_id`
  - `event_name = onboarding_activated`
  - `system_status_snapshot`

## Logica esperada

- reutilizar un snapshot sanitario explicito de `/api/system/status`
- verificar que:
  - `system_status_snapshot.onboardingDispatch.configured = true`
  - `system_status_snapshot.onboardingDispatch.pathStatus = expected`

En esta fase no debe requerir credenciales nuevas ni acceso privilegiado adicional.

## Output esperado

```json
{
  "workflow_name": "onboarding_dispatch_health_checked",
  "workflow_version": "v1",
  "correlation_id": "uuid",
  "cliente_id": "uuid",
  "check_name": "dispatch_health_checked",
  "check_status": "completed",
  "result_summary": "onboardingDispatch configurado y con path esperado",
  "next_action": "Continuar con onboarding_sanitized_report_compiled",
  "sanitized_result": {
    "configured": true,
    "pathStatus": "expected"
  }
}
```

## Sistemas afectados

- sin lecturas adicionales en backend desde n8n
- escritura tecnica en `ejecuciones_workflows`

## Riesgos

- bajo si reutiliza snapshot sanitario,
- medio si en el futuro se resuelve con llamada HTTP directa y se abren nuevas dependencias.

## Idempotencia

- clave recomendada: `onboarding_dispatch_health_checked + correlation_id`

## Validacion esperada

- fila tecnica en `ejecuciones_workflows`
- `sanitized_result.pathStatus = expected`

## Validacion tecnica ya realizada

- validacion SDK oficial de n8n: correcta
- prueba segura con datos fijados en n8n Cloud: correcta
- script operativo preparado para validacion real: `scripts/verify-onboarding-dispatch-workflow.ps1`
- validacion en ejecucion real con trazabilidad por `correlation_id`: correcta
