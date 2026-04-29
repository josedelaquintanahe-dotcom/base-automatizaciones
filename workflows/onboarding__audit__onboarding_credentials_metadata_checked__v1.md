# Workflow `onboarding__audit__onboarding_credentials_metadata_checked__v1`

## Objetivo

Verificar solo metadatos operativos de credenciales y token ya presentes en el payload de onboarding, sin leer ni desencriptar secretos.

## Trigger

- tipo canonico: webhook `POST` interno/controlado
- ruta activa: `/webhook/onboarding_credentials_metadata_checked`
- origen esperado: flujo tecnico derivado de `onboarding_activated` mediante `correlation_id`
- estado actual: blueprint SDK validado, workflow publicado en n8n Cloud (`GWjTrTPILaIRQ6ZO`) y validado en ejecucion real el 29 de abril de 2026

## Input esperado

- payload minimo:
  - `correlation_id`
  - `cliente_id`
  - `event_name = onboarding_activated`

## Logica esperada

- leer `automation_events` por `correlation_id` y `event_name = onboarding_activated`,
- extraer del `payload` persistido:
  - `operational_summary.credenciales.activas`
  - `operational_summary.credenciales.tipos_configurados`
  - `operational_summary.access.token_operativo_activo`
- verificar que:
  - `operational_summary.credenciales.activas > 0`
  - `operational_summary.credenciales.tipos_configurados` tenga al menos un tipo
  - `operational_summary.access.token_operativo_activo = true`

## Output esperado

```json
{
  "workflow_name": "onboarding_credentials_metadata_checked",
  "workflow_version": "v1",
  "correlation_id": "uuid",
  "cliente_id": "uuid",
  "check_name": "credentials_metadata_checked",
  "check_status": "completed",
  "result_summary": "Metadatos de credenciales y token coherentes",
  "next_action": "Continuar con onboarding_dispatch_health_checked",
  "sanitized_result": {
    "credenciales_activas": 2,
    "tipos_credencial": ["gmail", "api"],
    "token_operativo_activo": true
  }
}
```

## Sistemas afectados

- lectura de `automation_events`
- escritura tecnica en `ejecuciones_workflows`

## Riesgos

- muy bajo,
- no sustituye a una futura verificacion profunda de integraciones porque no toca secretos ni conexiones reales.

## Idempotencia

- clave recomendada: `onboarding_credentials_metadata_checked + correlation_id`

## Validacion esperada

- fila tecnica en `ejecuciones_workflows`
- sin secretos en `sanitized_result`

## Validacion tecnica ya realizada

- validacion SDK oficial de n8n: correcta
- prueba segura con datos fijados en n8n Cloud: correcta
- script operativo preparado para validacion real: `scripts/verify-onboarding-credentials-workflow.ps1`
- validacion en ejecucion real con trazabilidad por `correlation_id`: correcta
