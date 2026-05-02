# automation__internal__automation_client_controlled_run_stage__v1

## Nombre logico

`automation_client_controlled_run_stage`

## Objetivo

Programar de forma controlada la primera ejecucion operativa de una automatizacion objetivo ya existente del cliente, usando solo el `client_snapshot` sanitario y un `requested_first_run_at` explicito.

## Trigger

- webhook `POST`
- ruta activa prevista: `/webhook/automation_client_controlled_run_stage`

## Entradas esperadas

- `correlation_id`
- `cliente_id`
- `automation_id`
- `workflow_name`
- `trigger_source`
- `request_payload`
- `client_snapshot`

`request_payload` debe incluir:

- `scope`
- `target_workflow_id`
- `requested_first_run_at`

`request_payload` puede incluir:

- `run_window`
- `rollback_mode`
- `previous_next_run`

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

- lectura:
  - `automatizaciones` para localizar la automatizacion objetivo
- escritura tecnica:
  - `ejecuciones_workflows`
- escritura operativa controlada:
  - `automatizaciones.proxima_ejecucion`
- escritura de negocio indirecta:
  - `ejecuciones` la registra backend al invocar este webhook

## Efecto operativo controlado

Si el cliente supera readiness y la automatizacion objetivo existe y esta `activa`, el workflow actualiza `proxima_ejecucion` de esa automatizacion al valor de `requested_first_run_at`.

No dispara todavia la ejecucion final ni llama a sistemas externos.

Si `rollback_mode = true`, el workflow restaura `proxima_ejecucion` al valor de `previous_next_run` y deja la misma trazabilidad tecnica.

## Resultado sanitario esperado

`sanitized_result` debe incluir como minimo:

- `stage_status`
- `go_live_ready`
- `target_automation_id`
- `target_workflow_id`
- `target_nombre`
- `target_previous_status`
- `target_previous_next_run`
- `scheduled_first_run_at`
- `run_window`
- `requested_scope`
- `rollback_plan`
- `blocking_requirements_count`

## Riesgos controlados

- no usa credenciales desencriptadas
- no llama a servicios externos
- no ejecuta todavia la automatizacion final
- solo modifica `proxima_ejecucion` de una automatizacion objetivo ya existente
- el rollback puede restaurar el valor previo de `proxima_ejecucion`

## Rollback

Rollback minimo:

1. restaurar `proxima_ejecucion` al valor previo,
2. si hiciera falta, pausar manualmente la automatizacion objetivo,
3. conservar `correlation_id` y resultado tecnico de staging.

## Dependencias

- backend con:
  - provisionado de automatizacion base por `template`
  - ejecucion por `n8n_workflow_id` real
  - payload sanitario con `client_snapshot`
- credencial Supabase activa en n8n
- automatizacion objetivo ya provisionada para el cliente

## Validacion recomendada

1. Provisionar la automatizacion base usando `template=client_controlled_run_stage`.
2. Ejecutarla desde endpoint administrativo de backoffice con:
   - `target_workflow_id`
   - `requested_first_run_at`
3. Confirmar:
   - fila `exito` en `ejecuciones`
   - fila `completed` en `ejecuciones_workflows`
   - mismo `correlation_id`
   - cambio efectivo en `automatizaciones.proxima_ejecucion`
4. Ejecutar el propio workflow en `rollback_mode` para restaurar el valor previo de `proxima_ejecucion`.
5. Usar `scripts/verify-client-controlled-run-stage-automation.ps1` como prueba operativa versionada.
