# Workflow `onboarding__audit__onboarding_trace_verified__v1`

## Objetivo

Confirmar que el evento `onboarding_activated` ha quedado persistido correctamente en `automation_events` con el mismo `correlation_id` recibido desde el flujo inicial.

## Por que es el siguiente paso

Es el bloque de menor riesgo y mayor valor inmediato porque cierra explicitamente la validacion `backend -> automation_events` antes de ampliar la secuencia con mas checks tecnicos.

## Trigger

- tipo recomendado: `Execute Workflow` desde `onboarding_activated` o `webhook` interno controlado
- origen esperado: workflow `onboarding_activated`

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
  "output_payload": {
    "matched_event_name": "onboarding_activated",
    "dispatch_status": "accepted"
  }
}
```

## Sistemas afectados

- lectura de `automation_events`
- escritura tecnica en `ejecuciones_workflows`

## Riesgos

- bajo,
- posible falso negativo si el workflow se ejecuta antes de que el evento este visible; debe contemplarse una espera o reintento tecnico acotado.

## Idempotencia

- clave recomendada: `onboarding_trace_verified + correlation_id`

## Validacion esperada

- fila en `ejecuciones_workflows` con `workflow_name = onboarding_trace_verified`
- `output_payload.dispatch_status = accepted`
- mismo `correlation_id` que el workflow padre
