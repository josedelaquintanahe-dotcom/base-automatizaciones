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
- `curl.exe`
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
- `curl.exe`
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
