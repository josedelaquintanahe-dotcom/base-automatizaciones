# Workflow `onboarding__audit__onboarding_readiness_revalidated__v1`

## Objetivo

Revalidar las condiciones de readiness presentes en el payload de onboarding para detectar deriva operativa entre la activacion y la secuencia tecnica posterior.

## Trigger

- tipo canonico: webhook `POST` interno/controlado
- ruta activa: `/webhook/onboarding_readiness_revalidated`
- origen esperado: flujo tecnico derivado de `onboarding_activated` mediante `correlation_id`
- estado actual: blueprint SDK validado, workflow publicado en n8n Cloud (`NxCOMdciTp8QkDtb`) y validado en ejecucion real el 29 de abril de 2026

## Input esperado

- payload minimo:
  - `correlation_id`
  - `cliente_id`
  - `event_name = onboarding_activated`

## Logica esperada

- leer `automation_events` por `correlation_id` y `event_name = onboarding_activated`,
- extraer del `payload` persistido:
  - `automation_readiness`
  - `onboarding_status`
- verificar que:
  - `automation_readiness.ready = true`
  - `automation_readiness.missing_requirements` este vacio
  - `onboarding_status = listo_para_automatizar`

No debe recalcular estados desde credenciales reales en esta fase. Solo debe revalidar el contrato recibido y dejar evidencia sanitaria.

## Output esperado

```json
{
  "workflow_name": "onboarding_readiness_revalidated",
  "workflow_version": "v1",
  "correlation_id": "uuid",
  "cliente_id": "uuid",
  "check_name": "readiness_revalidated",
  "check_status": "completed",
  "result_summary": "Readiness del payload sigue consistente",
  "next_action": "Continuar con onboarding_credentials_metadata_checked",
  "sanitized_result": {
    "ready": true,
    "missing_requirements_count": 0,
    "onboarding_status": "listo_para_automatizar"
  }
}
```

## Sistemas afectados

- lectura de `automation_events`
- escritura tecnica en `ejecuciones_workflows`

## Riesgos

- bajo,
- puede no detectar deriva real en base de datos si el payload ya naciera desfasado; esa comprobacion profunda se deja para fases posteriores con mas privilegio.

## Idempotencia

- clave recomendada: `onboarding_readiness_revalidated + correlation_id`

## Validacion esperada

- fila tecnica en `ejecuciones_workflows`
- `sanitized_result.ready = true`

## Validacion tecnica ya realizada

- validacion SDK oficial de n8n: correcta
- prueba segura con datos fijados en n8n Cloud: correcta
- script operativo preparado para validacion real: `scripts/verify-onboarding-readiness-workflow.ps1`
- validacion en ejecucion real con trazabilidad por `correlation_id`: correcta
