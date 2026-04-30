# automation__internal__automation_client_next_actions_brief__v1

## Nombre logico

`automation_client_next_actions_brief`

## Objetivo

Generar un brief operativo interno con los siguientes pasos recomendados para un cliente ya dado de alta, usando solo el `client_snapshot` sanitario preparado por backend.

## Trigger

- webhook `POST`
- ruta activa prevista: `/webhook/automation_client_next_actions_brief`

## Entradas esperadas

- `correlation_id`
- `cliente_id`
- `automation_id`
- `workflow_name`
- `trigger_source`
- `request_payload`
- `client_snapshot`

`client_snapshot` debe incluir:

- `cliente`
- `operational_summary`
- `automation_readiness`

No debe incluir credenciales desencriptadas ni secretos.

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
- `readiness_ready`
- `priority`
- `blocking_requirements_count`
- `recommended_actions`
- `credenciales_activas`
- `token_operativo_activo`
- `factura_inicial_emitida`
- `requested_scope`

## Riesgos controlados

- no usa credenciales desencriptadas
- no modifica tablas de negocio del cliente
- no dispara acciones externas irreversibles
- puede ejecutarse aunque el cliente no este listo, porque su objetivo es producir un brief diagnostico

## Dependencias

- backend con:
  - provisionado de automatizacion base por `template`
  - ejecucion por `n8n_workflow_id` real
  - payload sanitario con `client_snapshot`
- credencial Supabase activa en n8n

## Validacion recomendada

1. Provisionar la automatizacion base del cliente usando `template=client_next_actions_brief`.
2. Ejecutarla desde endpoint administrativo de backoffice.
3. Confirmar:
   - fila `exito` en `ejecuciones`
   - fila `completed` en `ejecuciones_workflows`
   - mismo `correlation_id`
   - `sanitized_result.recommended_actions` con contenido coherente
4. Usar `scripts/verify-client-next-actions-automation.ps1` como prueba operativa versionada.
