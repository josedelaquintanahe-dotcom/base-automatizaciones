# Scripts

## Proposito

Agrupar scripts auxiliares de mantenimiento y verificacion operativa compatibles con Windows.

## Scripts disponibles

### `verify-onboarding-flow.ps1`

Verifica el flujo real de onboarding contra un backend desplegado:

1. comprueba `GET /api/system/status` y exige `onboardingDispatch.configured = true` y `pathStatus = expected`,
2. activa onboarding para un `cliente_id`,
3. recoge el `correlation_id` devuelto por backend,
4. consulta `automation_events` en Supabase,
5. consulta `ejecuciones_workflows`,
6. confirma que el flujo termina con `workflow_status = completed`.

## Entradas

- `ClientId` obligatorio
- `EnvFile` opcional, por defecto `src/backend/.env.local`
- `BackendBaseUrl` opcional, por defecto `https://base-automatizaciones.onrender.com`
- `PollAttempts` opcional
- `PollDelaySeconds` opcional

## Salida

- resumen JSON con estado HTTP, `correlation_id`, webhook usado y resultado de trazabilidad
- el JSON incluye tambien el bloque `preflight`
- codigo de salida distinto de cero si la validacion falla

## Dependencias

- PowerShell
- `node.exe`
- `scripts/http-json.mjs`
- variables reales de `BACKOFFICE_API_TOKEN`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`

## Reglas

- no versionar secretos reales,
- no fijar `cliente_id` reales en el script,
- usarlo tras cambios en Render, en webhooks de n8n o en despliegues del backend.

### `run-onboarding-operational-check.ps1`

Punto de entrada operativo para post-despliegue o cambios de entorno.

Verifica en una sola ejecucion:

1. `GET /api/health`
2. `GET /api/system/status`
3. smoke test real de onboarding reutilizando `verify-onboarding-flow.ps1`

Ejemplo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-onboarding-operational-check.ps1 -ClientId "<uuid-del-cliente>"
```

Falla con codigo distinto de cero si:

- `health` no responde `ok`,
- `onboardingDispatch` no aparece configurado y con `pathStatus = expected`,
- el smoke test real no termina con trazabilidad completa.

### `verify-onboarding-trace-workflow.ps1`

Verifica el primer workflow de auditoria post-onboarding una vez exista un `correlation_id` valido y el workflow este activo:

1. resuelve la URL del webhook de `onboarding_trace_verified`,
2. envia un payload tecnico con `correlation_id`, `cliente_id` y `event_name = onboarding_activated`,
3. consulta `ejecuciones_workflows` en Supabase,
4. confirma que `onboarding_trace_verified` persiste una fila con `status = completed`.

## Entradas

- `CorrelationId` obligatorio
- `ClientId` obligatorio
- `EnvFile` opcional, por defecto `src/backend/.env.local`
- `WorkflowWebhookUrl` opcional; si no se pasa, se compone desde `N8N_WEBHOOK_BASE_URL`
- `PollAttempts` opcional
- `PollDelaySeconds` opcional

## Salida

- resumen JSON con estado HTTP, webhook usado, `correlation_id` y persistencia detectada
- codigo de salida distinto de cero si la validacion falla

## Dependencias

- PowerShell
- `node.exe`
- `scripts/http-json.mjs`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_BASE_URL` si no se pasa `WorkflowWebhookUrl`

## Reglas

- usarlo solo cuando `onboarding_trace_verified` este activo o cuando se quiera comprobar su endpoint real,
- soporta entornos donde `N8N_WEBHOOK_BASE_URL` apunte al endpoint MCP; en ese caso normaliza la URL publica del webhook,
- no fijar `correlation_id` ni `cliente_id` reales dentro del script,
- preferir un `correlation_id` obtenido de una activacion de onboarding recien validada.

### `verify-onboarding-readiness-workflow.ps1`

Verifica el segundo workflow de auditoria post-onboarding una vez exista un `correlation_id` valido:

1. resuelve la URL del webhook de `onboarding_readiness_revalidated`,
2. envia un payload tecnico minimo con `correlation_id`, `cliente_id` y `event_name`,
3. deja que el workflow lea `automation_events.payload`,
4. confirma que `onboarding_readiness_revalidated` persiste una fila con `status = completed`.

## Entradas

- `CorrelationId` obligatorio
- `ClientId` obligatorio
- `EnvFile` opcional, por defecto `src/backend/.env.local`
- `WorkflowWebhookUrl` opcional; si no se pasa, se compone desde `N8N_WEBHOOK_BASE_URL`
- `PollAttempts` opcional
- `PollDelaySeconds` opcional

## Salida

- resumen JSON con estado HTTP, webhook usado, `correlation_id` y persistencia detectada
- codigo de salida distinto de cero si la validacion falla

## Dependencias

- PowerShell
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_BASE_URL` si no se pasa `WorkflowWebhookUrl`

## Reglas

- usarlo cuando el workflow este activo o cuando se quiera comprobar su endpoint real,
- soporta entornos donde `N8N_WEBHOOK_BASE_URL` apunte al endpoint MCP; en ese caso normaliza la URL publica del webhook,
- no fijar `correlation_id` ni `cliente_id` reales dentro del script,
- preferir un `correlation_id` obtenido de una activacion de onboarding recien validada.

### `verify-onboarding-credentials-workflow.ps1`

Verifica el tercer workflow de auditoria post-onboarding usando el payload real persistido del evento origen:

1. resuelve la URL del webhook de `onboarding_credentials_metadata_checked`,
2. envia un payload tecnico minimo con `correlation_id`, `cliente_id` y `event_name`,
3. deja que el workflow lea `automation_events.payload.operational_summary`,
4. confirma que `onboarding_credentials_metadata_checked` persiste una fila con `status = completed`.

## Entradas

- `CorrelationId` obligatorio
- `ClientId` obligatorio
- `EnvFile` opcional, por defecto `src/backend/.env.local`
- `WorkflowWebhookUrl` opcional; si no se pasa, se compone desde `N8N_WEBHOOK_BASE_URL`
- `PollAttempts` opcional
- `PollDelaySeconds` opcional

## Salida

- resumen JSON con estado HTTP, webhook usado, `correlation_id` y persistencia detectada
- codigo de salida distinto de cero si la validacion falla

## Dependencias

- PowerShell
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_BASE_URL` si no se pasa `WorkflowWebhookUrl`

## Reglas

- usarlo cuando el workflow este activo o cuando se quiera comprobar su endpoint real,
- soporta entornos donde `N8N_WEBHOOK_BASE_URL` apunte al endpoint MCP; en ese caso normaliza la URL publica del webhook,
- no fijar `correlation_id` ni `cliente_id` reales dentro del script,
- preferir un `correlation_id` obtenido de una activacion de onboarding recien validada.

### `verify-onboarding-dispatch-workflow.ps1`

Verifica el cuarto workflow de auditoria post-onboarding usando un snapshot sanitario real del backend:

1. consulta `GET /api/system/status`,
2. construye un payload tecnico con `correlation_id`, `cliente_id`, `event_name` y `system_status_snapshot`,
3. invoca `onboarding_dispatch_health_checked`,
4. confirma que persiste una fila con `status = completed`.

### `verify-onboarding-report-workflow.ps1`

Verifica el workflow final de consolidacion sanitaria:

1. invoca `onboarding_sanitized_report_compiled` con `correlation_id` y `cliente_id`,
2. confirma que el workflow consolida la secuencia previa en `ejecuciones_workflows`,
3. valida `all_checks_passed = true` de forma indirecta a traves de la persistencia y la respuesta.

### `run-onboarding-audit-sequence.ps1`

Punto de entrada operativo para ejecutar la secuencia auditiva completa:

1. lanza `run-onboarding-operational-check.ps1` para generar un `correlation_id` nuevo,
2. ejecuta en orden:
   - `verify-onboarding-trace-workflow.ps1`
   - `verify-onboarding-readiness-workflow.ps1`
   - `verify-onboarding-credentials-workflow.ps1`
   - `verify-onboarding-dispatch-workflow.ps1`
   - `verify-onboarding-report-workflow.ps1`
3. devuelve un resumen JSON completo de la cadena real.

### `verify-onboarding-automated-audit-chain.ps1`

Verifica la nueva automatizacion real de onboarding usando un unico disparo desde backend:

1. ejecuta `verify-onboarding-flow.ps1` para activar onboarding y obtener un `correlation_id` nuevo,
2. espera a que `onboarding_activated` encadene por si mismo los 5 workflows auditivos,
3. consulta `ejecuciones_workflows` en Supabase,
4. confirma que estos 6 workflows terminan en `completed` para el mismo `correlation_id`:
   - `onboarding_activated`
   - `onboarding_trace_verified`
   - `onboarding_readiness_revalidated`
   - `onboarding_credentials_metadata_checked`
   - `onboarding_dispatch_health_checked`
   - `onboarding_sanitized_report_compiled`
5. valida que el reporte final deje `all_checks_passed = true`.

Este es el script recomendado para comprobar que la automatizacion de onboarding ya no se limita al webhook inicial y que la cadena auditiva completa se ejecuta automaticamente.

### `verify-client-health-snapshot-automation.ps1`

Verifica la primera automatizacion funcional real basada en `automatizaciones`:

1. provisiona de forma idempotente la automatizacion base `client_health_snapshot` para un cliente existente,
2. la ejecuta mediante endpoint administrativo de backoffice,
3. recoge el `correlation_id` de la ejecucion,
4. confirma:
   - fila `exito` en `ejecuciones`,
   - fila `completed` en `ejecuciones_workflows`,
   - mismo `correlation_id` en la traza n8n.

Dependencias adicionales:

- `BACKOFFICE_API_TOKEN`
- backend desplegado con las nuevas rutas de `automatizaciones/backoffice`

### `verify-client-next-actions-automation.ps1`

Verifica la segunda automatizacion funcional real basada en `automatizaciones`:

1. provisiona de forma idempotente la automatizacion base `client_next_actions_brief` para un cliente existente,
2. la ejecuta mediante endpoint administrativo de backoffice,
3. recoge el `correlation_id` de la ejecucion,
4. confirma:
   - fila `exito` en `ejecuciones`,
   - fila `completed` en `ejecuciones_workflows`,
   - mismo `correlation_id` en la traza n8n,
   - `recommended_actions` en el resultado sanitario.

Dependencias adicionales:

- `BACKOFFICE_API_TOKEN`
- backend desplegado con soporte para `template=client_next_actions_brief`

### `verify-client-first-run-handoff-automation.ps1`

Verifica la siguiente automatizacion interna preparada para primer arranque controlado:

1. provisiona de forma idempotente la automatizacion base `client_first_run_handoff`,
2. la ejecuta desde backoffice con `candidate_automation` y `run_window`,
3. recoge el `correlation_id`,
4. confirma:
   - fila `exito` en `ejecuciones`,
   - fila `completed` en `ejecuciones_workflows`,
   - mismo `correlation_id`,
   - `preflight_checklist` y `rollback_notes` en el resultado sanitario.

Dependencias adicionales:

- `BACKOFFICE_API_TOKEN`
- backend desplegado con soporte para `template=client_first_run_handoff`

Nota de compatibilidad:

- las llamadas al backend usan `Invoke-WebRequest -UseBasicParsing` para funcionar tambien en Windows PowerShell clasico

### `verify-client-controlled-run-stage-automation.ps1`

Verifica la primera automatizacion con efecto operativo controlado:

1. localiza una automatizacion objetivo ya provisionada para el cliente,
2. provisiona de forma idempotente `client_controlled_run_stage`,
3. ejecuta el staging indicando `target_workflow_id` y `requested_first_run_at`,
4. confirma:
   - fila `exito` en `ejecuciones`,
   - fila `completed` en `ejecuciones_workflows`,
   - mismo `correlation_id`,
   - cambio efectivo en `automatizaciones.proxima_ejecucion`,
5. ejecuta un rollback controlado por el mismo workflow para restaurar el valor previo de `proxima_ejecucion`.

Dependencias adicionales:

- `BACKOFFICE_API_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- backend con soporte para `template=client_controlled_run_stage`

Regla operativa:

- usarlo primero contra backend local o staging, y exigir que la restauracion pase por el mismo contrato del workflow antes de dar la validacion por buena

### `verify-client-invoice-draft-automation.ps1`

Verifica la primera automatizacion objetivo con efecto operativo real controlado:

1. provisiona de forma idempotente `client_invoice_draft_create`,
2. resuelve un `invoice_month` futuro no usado para el cliente,
3. ejecuta la creacion del borrador desde backoffice,
4. confirma:
   - fila `exito` en `ejecuciones`,
   - fila `completed` en `ejecuciones_workflows`,
   - mismo `correlation_id`,
   - nueva fila `pendiente` en `facturas`,
5. ejecuta rollback por el mismo workflow,
6. confirma que la misma factura termina en estado `cancelada`.

Dependencias adicionales:

- `BACKOFFICE_API_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- backend con soporte para `template=client_invoice_draft_create`

Regla operativa:

- usarlo primero contra backend local o staging,
- considerar valida la automatizacion solo cuando el rollback pase por el mismo contrato del workflow y la fila de `facturas` quede cancelada, no eliminada.

Nota de compatibilidad:

- para validaciones remotas con backend desplegado, este script y `verify-client-controlled-run-stage-automation.ps1` delegan el cuerpo JSON a un archivo temporal y lo envian a `node.exe` mediante `scripts/http-json.mjs`; esto evita falsos fallos de quoting en Windows PowerShell.

### `verify-client-invoice-mark-paid-automation.ps1`

Verifica la siguiente automatizacion objetivo sobre `facturas` con mutacion reversible:

1. localiza una factura existente en estado `pendiente` para el cliente,
2. provisiona de forma idempotente `client_invoice_mark_paid`,
3. ejecuta el marcado como pagada desde backoffice,
4. confirma:
   - fila `exito` en `ejecuciones`,
   - fila `completed` en `ejecuciones_workflows`,
   - mismo `correlation_id`,
   - misma factura final en estado `pagada`,
5. ejecuta rollback por el mismo workflow,
6. confirma que la misma factura vuelve a `pendiente`,
7. exige que el rollback deje un segundo `correlation_id` tecnico distinto al de la ejecucion principal.

Dependencias adicionales:

- `BACKOFFICE_API_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- backend con soporte para `template=client_invoice_mark_paid`

Regla operativa:

- usarlo primero contra backend local o staging,
- exigir que el rollback pase por el mismo contrato del workflow y restaure exactamente la misma factura a `pendiente`.

Nota de compatibilidad:

- reutiliza el mismo patron de envio JSON a archivo temporal via `node.exe` y `scripts/http-json.mjs` para evitar falsos fallos de quoting en Windows PowerShell.

### `verify-client-invoice-cancel-automation.ps1`

Verifica la siguiente rama operativa objetivo sobre `facturas` con mutacion reversible:

1. localiza una factura existente en estado `pendiente` para el cliente,
2. provisiona de forma idempotente `client_invoice_cancel`,
3. ejecuta la cancelacion desde backoffice,
4. confirma:
   - fila `exito` en `ejecuciones`,
   - fila `completed` en `ejecuciones_workflows`,
   - mismo `correlation_id`,
   - misma factura final en estado `cancelada`,
5. ejecuta rollback por el mismo workflow,
6. confirma que la misma factura vuelve a `pendiente`,
7. exige que el rollback deje un segundo `correlation_id` tecnico distinto al de la ejecucion principal.

Dependencias adicionales:

- `BACKOFFICE_API_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- backend con soporte para `template=client_invoice_cancel`

Regla operativa:

- usarlo primero contra backend local o staging,
- exigir que el rollback pase por el mismo contrato del workflow y restaure exactamente la misma factura a `pendiente`.

Nota de compatibilidad:

- reutiliza el mismo patron de envio JSON a archivo temporal via `node.exe` y `scripts/http-json.mjs` para evitar falsos fallos de quoting en Windows PowerShell.
