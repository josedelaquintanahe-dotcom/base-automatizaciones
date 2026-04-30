# automation__internal__automation_client_first_run_handoff__v1

## Nombre logico

`automation_client_first_run_handoff`

## Objetivo

Generar un paquete operativo interno para preparar la primera ejecucion real controlada de una automatizacion de cliente, usando solo el `client_snapshot` sanitario y el contexto solicitado desde backend.

## Trigger

- webhook `POST`
- ruta activa validada: `/webhook/automation_client_first_run_handoff`

## Entradas esperadas

- `correlation_id`
- `cliente_id`
- `automation_id`
- `workflow_name`
- `trigger_source`
- `request_payload`
- `client_snapshot`

`request_payload` puede incluir, si procede:

- `scope`
- `candidate_automation`
- `run_window`

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

- `handoff_status`
- `go_live_ready`
- `candidate_automation`
- `run_window`
- `preflight_checklist`
- `rollback_notes`
- `operator_handoff_notes`
- `blocking_requirements_count`
- `requested_scope`

## Riesgos controlados

- no usa credenciales desencriptadas
- no modifica tablas de negocio del cliente
- no llama a servicios externos
- no ejecuta la automatizacion final, solo prepara el handoff operativo

## Dependencias

- backend con:
  - provisionado de automatizacion base por `template`
  - ejecucion por `n8n_workflow_id` real
  - payload sanitario con `client_snapshot`
- credencial Supabase activa en n8n

## Validacion recomendada

1. Provisionar la automatizacion base del cliente usando `template=client_first_run_handoff`.
2. Ejecutarla desde endpoint administrativo de backoffice con un `candidate_automation` de prueba.
3. Confirmar:
   - fila `exito` en `ejecuciones`
   - fila `completed` en `ejecuciones_workflows`
   - mismo `correlation_id`
   - `sanitized_result.preflight_checklist` y `rollback_notes` con contenido coherente
4. Usar `scripts/verify-client-first-run-handoff-automation.ps1` como prueba operativa versionada.
