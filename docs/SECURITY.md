# SECURITY.md

## Objetivo

Definir reglas, riesgos y checklist de seguridad para el proyecto y para el sistema de agentes de Codex.

## Reglas principales

- no versionar secretos reales,
- no exponer tokens administrativos o `service_role` en frontend,
- no guardar `BACKOFFICE_API_TOKEN`, `JWT_SECRET`, `ENCRYPTION_KEY` ni claves de Supabase en variables `VITE_*`,
- no hacer push sin revisar secretos y diff,
- no cambiar produccion sin confirmacion,
- no asumir permisos reales no comprobados.

## Areas criticas

### Variables de entorno

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `BACKOFFICE_API_TOKEN`
- `ONBOARDING_DISPATCH_WEBHOOK_URL`
- webhooks reales de n8n

### Integraciones

- Supabase
- n8n
- Render
- Vercel
- APIs externas futuras

## Riesgos detectados

- deriva entre documentacion y configuracion real si no se mantiene `.env.example`
- posibles duplicados documentales que generen instrucciones inconsistentes
- cambios de automatizacion sin auditoria de trazabilidad o errores
- endpoints administrativos protegidos solo por bearer token mientras no exista un sistema formal de identidades

## Checklist minimo antes de cerrar un bloque sensible

- `git status` revisado
- no hay secretos nuevos en diff
- `.env.example` sigue siendo plantilla publica y no contiene valores reales
- documentacion relevante actualizada
- pruebas razonables ejecutadas
- riesgos residuales explicados

## Checklist minimo antes de release o despliegue

- variables de entorno revisadas
- `SUPABASE_SERVICE_ROLE_KEY` solo queda en backend o entorno server-side
- `ONBOARDING_DISPATCH_WEBHOOK_URL` y `N8N_WEBHOOK_BASE_URL` apuntan al entorno correcto
- CORS revisado
- endpoints administrativos protegidos
- integraciones externas documentadas
- tablas y cambios de datos revisados
- no hay placeholders confundidos con produccion

## Pendiente de validar

- cobertura completa de RLS segun futuras ampliaciones
- politicas de secretos en todos los entornos gestionados
