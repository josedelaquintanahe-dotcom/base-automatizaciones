# Workflow `onboarding__audit__onboarding_credentials_metadata_checked__v1`

## Objetivo

Verificar solo metadatos operativos de credenciales y token ya presentes en el payload de onboarding, sin leer ni desencriptar secretos.

## Trigger

- tipo recomendado: `Execute Workflow`
- origen esperado: despues de `onboarding_readiness_revalidated`

## Input esperado

- contrato comun definido en `n8n/docs/onboarding_audit_sequence.md`

## Logica esperada

- verificar que:
  - `operational_summary.credenciales_activas > 0`
  - `operational_summary.tipos_credencial` tenga al menos un tipo
  - `operational_summary.token_operativo_activo = true`

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
  "output_payload": {
    "credenciales_activas": 2,
    "tipos_credencial": ["gmail", "api"],
    "token_operativo_activo": true
  }
}
```

## Sistemas afectados

- escritura tecnica en `ejecuciones_workflows`

## Riesgos

- muy bajo,
- no sustituye a una futura verificacion profunda de integraciones porque no toca secretos ni conexiones reales.

## Idempotencia

- clave recomendada: `onboarding_credentials_metadata_checked + correlation_id`

## Validacion esperada

- fila tecnica en `ejecuciones_workflows`
- sin secretos en `output_payload`
