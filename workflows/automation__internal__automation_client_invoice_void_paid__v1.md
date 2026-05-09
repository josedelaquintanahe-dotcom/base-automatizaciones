# automation__internal__automation_client_invoice_void_paid__v1

## Nombre logico

`automation_client_invoice_void_paid`

## Objetivo

Anular de forma controlada una factura existente en estado `pagada`, produciendo un efecto real y reversible sobre `facturas` sin introducir servicios externos, credenciales nuevas ni cambios de esquema.

## Trigger

- webhook `POST`
- ruta activa prevista: `/webhook/automation_client_invoice_void_paid`

## Problema de negocio

Despues de validar `invoice_draft_create`, `invoice_mark_paid` e `invoice_cancel`, falta cubrir una rama de correccion realista: revertir una factura ya marcada como cobrada cuando el cobro fue registrado antes de tiempo, se detecta un error operativo o el pago debe dejar de considerarse confirmado.

Esta rama aporta valor porque:

- cubre una excepcion posterior al cobro sin introducir integraciones externas;
- reutiliza el mismo patron ya validado de mutacion reversible sobre `facturas`;
- evita que la unica salida ante un pago mal marcado sea depender del rollback inmediato de un flujo anterior.

## Opciones consideradas

### Opcion elegida: `automation_client_invoice_void_paid`

- transicion principal: `pagada -> cancelada`
- rollback: `cancelada -> pagada`
- valor: cubre una correccion operativa posterior al cobro y amplia el ciclo minimo de facturacion ya validado
- riesgo: bajo-medio, porque opera sobre una sola fila y usa estados ya permitidos por `database/schema.sql`

### Opcion descartada: `automation_client_invoice_reopen_cancelled`

- transicion principal: `cancelada -> pendiente`
- motivo de descarte: es util, pero se solapa demasiado con el rollback ya soportado por `automation_client_invoice_cancel`
- impacto: aporta menos valor nuevo que una anulacion directa de factura ya cobrada

### Opcion descartada: automatizacion externa de aviso o cobro

- motivo de descarte: introduciria email, pasarela o CRM demasiado pronto
- impacto: aumentaria dependencias, credenciales y riesgo sin cerrar antes la rama interna posterior al cobro

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
- `expected_status` con valor `pagada`

`request_payload` puede incluir adicionalmente:

- `invoice_month`
- `void_reason`
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
- valida que el estado actual sea `pagada`,
- condiciona la actualizacion final al `estado` previamente validado para evitar sobrescrituras concurrentes,
- actualiza `facturas.estado` a `cancelada`.

En modo rollback:

- valida que la factura objetivo siga siendo la misma,
- valida que el estado actual sea `cancelada`,
- condiciona la restauracion final al `estado` previamente validado para evitar sobrescrituras concurrentes,
- restaura `facturas.estado` a `pagada`.

## Resultado sanitario esperado

`sanitized_result` debe incluir como minimo:

- `action_mode`
- `invoice_id`
- `invoice_month`
- `previous_status`
- `invoice_status`
- `rollback_mode`
- `void_reason`
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
2. confirmar que la factura siga en `pagada` antes de anularla,
3. si ya esta `cancelada` o `pendiente`, dejar evidencia tecnica y resolver el caso desde backoffice antes de reintentar.

## Rollback

Rollback minimo:

1. ejecutar el propio workflow con `rollback_mode = true`,
2. restaurar `facturas.estado` a `pagada`,
3. conservar evidencia tecnica en `ejecuciones_workflows` y registrar un `correlation_id` tecnico independiente para el rollback.

## Dependencias

- backend con:
  - provisionado por `template=client_invoice_void_paid`
  - ejecucion por `n8n_workflow_id` real
  - payload sanitario con `client_snapshot`
- credencial Supabase activa en n8n
- cliente con al menos una factura `pagada` valida y trazable en `facturas`

## Alcance de implementacion esperado

- blueprint tecnico `n8n/workflows/automation_client_invoice_void_paid.workflow.ts`
- template backend provisionable en `src/backend/services/automatizacion.service.js`
- test unitario del template backend
- script operativo versionado `scripts/verify-client-invoice-void-paid-automation.ps1`
- actualizacion de `docs/N8N_WORKFLOWS.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md` y `scripts/README.md`

## Validacion recomendada

1. Provisionar la automatizacion base usando `template=client_invoice_void_paid`.
2. Ejecutarla desde endpoint administrativo de backoffice sobre una factura `pagada` conocida.
3. Confirmar:
   - fila `exito` en `ejecuciones`
   - fila `completed` en `ejecuciones_workflows`
   - mismo `correlation_id`
   - factura final en estado `cancelada`
4. Ejecutar el mismo workflow en `rollback_mode` sobre la misma factura.
5. Confirmar:
   - segundo `correlation_id` tecnico para rollback
   - factura final restaurada a `pagada`
6. Preparar `scripts/verify-client-invoice-void-paid-automation.ps1` como prueba operativa versionada.
