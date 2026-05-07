# automation__internal__automation_client_invoice_mark_paid__v1

## Nombre logico

`automation_client_invoice_mark_paid`

## Objetivo

Marcar como `pagada` una factura existente en estado `pendiente` para un cliente ya operativo, produciendo un efecto real y reversible sobre `facturas` sin introducir servicios externos ni credenciales nuevas.

## Trigger

- webhook `POST`
- ruta activa prevista: `/webhook/automation_client_invoice_mark_paid`

## Entradas esperadas

- `correlation_id`
- `cliente_id`
- `automation_id`
- `workflow_name`
- `trigger_source`
- `request_payload`
- `client_snapshot`

`request_payload` debe incluir en modo normal:

- `scope`
- `invoice_id`
- `expected_status` con valor `pendiente`

`request_payload` puede incluir adicionalmente:

- `invoice_month`
- `rollback_mode`

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
  - `facturas`
  - `client_snapshot.operational_summary.billing`
- escritura tecnica:
  - `ejecuciones_workflows`
- escritura operativa real:
  - `facturas`
- escritura de negocio indirecta:
  - `ejecuciones` la registra backend al invocar este webhook

## Efecto operativo real controlado

En modo normal:

- valida que la factura exista y pertenezca al `cliente_id`,
- valida que el estado actual sea `pendiente`,
- condiciona la actualizacion final al `estado` previamente validado para evitar sobrescrituras concurrentes,
- actualiza `facturas.estado` a `pagada`.

En modo rollback:

- valida que la factura objetivo siga siendo la misma,
- valida que el estado actual sea `pagada`,
- condiciona la restauracion final al `estado` previamente validado para evitar sobrescrituras concurrentes,
- restaura `facturas.estado` a `pendiente`.

## Resultado sanitario esperado

`sanitized_result` debe incluir como minimo:

- `action_mode`
- `invoice_id`
- `invoice_month`
- `previous_status`
- `invoice_status`
- `rollback_mode`
- `billing_context_available`
- `status_transition_allowed`
- `rollback_plan`

## Riesgos controlados

- no usa credenciales desencriptadas
- no llama a servicios externos
- no modifica `clientes` ni `automatizaciones`
- el efecto real se limita a un cambio de estado sobre una fila ya existente en `facturas`
- el rollback queda soportado por el mismo workflow mientras la factura siga en fase operativa segura

## Fallback manual

Si el workflow rechaza la transicion:

1. revisar que `invoice_id` pertenezca al cliente esperado,
2. confirmar que la factura siga en `pendiente` antes de marcarla como `pagada`,
3. si ya esta `cancelada` o `pagada`, dejar evidencia tecnica y resolver el caso desde backoffice antes de reintentar.

## Rollback

Rollback minimo:

1. ejecutar el propio workflow con `rollback_mode = true`,
2. restaurar `facturas.estado` a `pendiente`,
3. conservar evidencia tecnica en `ejecuciones_workflows` y registrar un `correlation_id` tecnico independiente para el rollback.

## Dependencias

- backend con:
  - provisionado por `template=client_invoice_mark_paid`
  - ejecucion por `n8n_workflow_id` real
  - payload sanitario con `client_snapshot`
- credencial Supabase activa en n8n
- cliente con al menos una factura `pendiente` valida y trazable en `facturas`

## Validacion recomendada

1. Provisionar la automatizacion base usando `template=client_invoice_mark_paid`.
2. Ejecutarla desde endpoint administrativo de backoffice sobre una factura `pendiente` conocida.
3. Confirmar:
   - fila `exito` en `ejecuciones`
   - fila `completed` en `ejecuciones_workflows`
   - mismo `correlation_id`
   - factura final en estado `pagada`
4. Ejecutar el mismo workflow en `rollback_mode` sobre la misma factura.
5. Confirmar:
   - segundo `correlation_id` tecnico para rollback
   - factura final restaurada a `pendiente`
6. Usar `scripts/verify-client-invoice-mark-paid-automation.ps1` como prueba operativa versionada.
7. Para una validacion local segura, sobrescribir `BackendBaseUrl` y usar un `.env` no productivo con Supabase y n8n aislados antes de mutar una factura real.
