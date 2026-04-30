# automation__internal__automation_client_health_snapshot__v1

## Nombre logico

`automation_client_health_snapshot`

## Objetivo

Generar un snapshot sanitario interno del cliente y de su estado operativo de automatizacion usando un payload seguro emitido por backend.

## Trigger

- webhook `POST`
- ruta activa prevista: `/webhook/automation_client_health_snapshot`

## Entradas esperadas

- `correlation_id`
- `cliente_id`
- `automation_id`
- `workflow_name`
- `trigger_source`
- `request_payload`
- `client_snapshot`

`client_snapshot` debe ser sanitario y venir ya preparado desde backend. No debe incluir credenciales desencriptadas ni secretos.

## Salidas esperadas

Respuesta `202` con:

- `accepted`
- `workflow_name`
- `correlation_id`
- `automation_id`
- `result_summary`
- `next_action`
- `sanitized_result`

## Persistencia esperada

- lectura: ninguna obligatoria
- escritura tecnica:
  - `ejecuciones_workflows`
- escritura de negocio indirecta:
  - `ejecuciones` la registra backend al invocar este webhook

## Resultado sanitario esperado

`sanitized_result` debe incluir como minimo:

- `onboarding_status`
- `credenciales_activas`
- `token_operativo_activo`
- `factura_inicial_emitida`
- `readiness_ready`
- `requested_scope`

## Riesgos controlados

- no usa credenciales desencriptadas
- no modifica tablas de negocio del cliente
- no ejecuta acciones externas irreversibles
- falla de forma trazable sobre `ejecuciones_workflows`

## Dependencias

- backend con:
  - provisionado de automatizacion base
  - ejecucion por `n8n_workflow_id` real
  - payload sanitario con `client_snapshot`
- credencial Supabase activa en n8n

## Validacion recomendada

1. Provisionar la automatizacion base del cliente.
2. Ejecutarla desde endpoint administrativo de backoffice.
3. Confirmar:
   - fila `exito` en `ejecuciones`
   - fila `completed` en `ejecuciones_workflows`
   - mismo `correlation_id`
4. Usar `scripts/verify-client-health-snapshot-automation.ps1` como prueba operativa versionada.
