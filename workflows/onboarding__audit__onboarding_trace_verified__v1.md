# Workflow `onboarding__audit__onboarding_trace_verified__v1`

## Objetivo

Confirmar que el evento `onboarding_activated` ha quedado persistido correctamente en `automation_events` con el mismo `correlation_id` recibido desde el flujo inicial.

## Por que es el siguiente paso

Es el bloque de menor riesgo y mayor valor inmediato porque cierra explicitamente la validacion `backend -> automation_events` antes de ampliar la secuencia con mas checks tecnicos.

## Trigger

- tipo canonico: webhook `POST` interno/controlado
- ruta activa: `/webhook/onboarding_trace_verified`
- origen esperado: flujo tecnico derivado de `onboarding_activated`
- estado actual: blueprint SDK validado, workflow publicado en n8n Cloud (`yqr1wDX4aDS9JyH5`) y validado en ejecucion real el 29 de abril de 2026

## Input esperado

- contrato comun definido en `n8n/docs/onboarding_audit_sequence.md`

## Consulta esperada

- leer `automation_events` filtrando por:
  - `correlation_id`
  - `event_name = onboarding_activated`

## Output esperado

```json
{
  "workflow_name": "onboarding_trace_verified",
  "workflow_version": "v1",
  "correlation_id": "uuid",
  "cliente_id": "uuid",
  "check_name": "trace_verified",
  "check_status": "completed",
  "result_summary": "Evento onboarding_activated localizado en automation_events",
  "next_action": "Continuar con onboarding_readiness_revalidated",
  "sanitized_result": {
    "matched_event_name": "onboarding_activated",
    "dispatch_status": "accepted"
  }
}
```

## Sistemas afectados

- lectura de `automation_events`
- escritura tecnica en `ejecuciones_workflows`

Nota:

El resultado sanitario persistido en la tabla actual debe viajar dentro de `input_payload.sanitized_result`.

## Riesgos

- bajo,
- posible falso negativo si el workflow se ejecuta antes de que el evento este visible; debe contemplarse una espera o reintento tecnico acotado.

## Idempotencia

- clave recomendada: `onboarding_trace_verified + correlation_id`

## Validacion esperada

- fila en `ejecuciones_workflows` con `workflow_name = onboarding_trace_verified`
- `sanitized_result.dispatch_status = accepted`
- mismo `correlation_id` que el workflow padre

## Validacion tecnica ya realizada

- validacion SDK oficial de n8n: correcta
- prueba segura con datos fijados en n8n Cloud: correcta
- script operativo preparado para validacion real: `scripts/verify-onboarding-trace-workflow.ps1`
- validacion en ejecucion real con trazabilidad por `correlation_id`: correcta
