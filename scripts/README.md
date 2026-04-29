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
