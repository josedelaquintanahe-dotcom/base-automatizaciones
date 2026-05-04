# automation__internal__automation_client_invoice_draft_create__v1

## Nombre logico

`automation_client_invoice_draft_create`

## Objetivo

Crear un borrador mensual de facturacion para un cliente ya operativo, produciendo un efecto real y reversible sobre la tabla `facturas` sin usar credenciales nuevas ni disparar acciones externas.

## Trigger

- webhook `POST`
- ruta activa prevista: `/webhook/automation_client_invoice_draft_create`

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
- `invoice_month`

`request_payload` debe incluir en modo rollback:

- `scope`
- `rollback_mode`
- `invoice_month`
- `invoice_id`

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

- crea una fila `pendiente` en `facturas` para `invoice_month`,
- reutiliza el `mantenimiento_mensual` de la ultima factura conocida,
- fija `setup_inicial = 0`,
- fija `total = mantenimiento_mensual`.

En modo rollback:

- localiza el borrador creado,
- actualiza su estado a `cancelada`,
- conserva la misma trazabilidad por `correlation_id`.

## Resultado sanitario esperado

`sanitized_result` debe incluir como minimo:

- `action_mode`
- `invoice_id`
- `invoice_month`
- `invoice_status`
- `maintenance_amount`
- `total_amount`
- `rollback_mode`
- `billing_context_available`
- `duplicate_blocked`
- `rollback_plan`

## Riesgos controlados

- no usa credenciales desencriptadas
- no llama a servicios externos
- no modifica clientes ni automatizaciones
- el efecto real se limita a crear o cancelar un borrador en `facturas`
- el rollback queda soportado por el mismo workflow

## Rollback

Rollback minimo:

1. ejecutar el propio workflow en `rollback_mode`,
2. marcar la factura creada como `cancelada`,
3. conservar `correlation_id` y evidencia tecnica en `ejecuciones_workflows`.

## Dependencias

- backend con:
  - provisionado por `template=client_invoice_draft_create`
  - ejecucion por `n8n_workflow_id` real
  - payload sanitario con `client_snapshot`
- credencial Supabase activa en n8n
- cliente con contexto de facturacion disponible en `client_snapshot.operational_summary.billing.ultima_factura`

## Validacion recomendada

1. Provisionar la automatizacion base usando `template=client_invoice_draft_create`.
2. Ejecutarla desde endpoint administrativo de backoffice con `invoice_month` futuro no usado.
3. Confirmar:
   - fila `exito` en `ejecuciones`
   - fila `completed` en `ejecuciones_workflows`
   - mismo `correlation_id`
   - nueva fila `pendiente` en `facturas`
4. Ejecutar el mismo workflow en `rollback_mode` para la factura creada.
5. Confirmar:
   - segundo `correlation_id` tecnico para rollback
   - factura final en estado `cancelada`
6. Usar `scripts/verify-client-invoice-draft-automation.ps1` como prueba operativa versionada.
