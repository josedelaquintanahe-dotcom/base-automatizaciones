# DEPLOYMENT.md

## Objetivo

Reunir una guia base de despliegue sin asumir mas alla de lo detectado en el repositorio.

## Detectado

- frontend preparado con Vite
- backend preparado para Node.js/Express
- `render.yaml` presente para backend
- no existe `package.json` en la raiz; los comandos se ejecutan por paquete
- no existe manifiesto de despliegue versionado para frontend
- Vercel aparece documentado como opcion, no como flujo confirmado en uso
- Supabase y n8n forman parte del entorno operativo

## Proveedores o piezas documentadas

- Render
- Vercel
- Supabase
- n8n Cloud

## Checklist base de preparacion

- dependencias instaladas por paquete
- comandos reales ejecutables y verificados por paquete:
  - backend: `npm install`, `npm run lint`, `npm test`
  - frontend: `npm install`, `npm run lint`, `npm test`, `npm run build`
- el backend no tiene script `build` actualmente
- no hay scripts unificados en la raiz del repositorio
- `.env.example` de raiz alineado con variables reales del backend
- `src/frontend/.env.example` alineado con `VITE_API_URL`
- `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md` actualizados
- endpoints, webhooks y tablas documentados
- riesgos de seguridad revisados

## Variables a revisar por entorno

- backend: Node, CORS, JWT, cifrado, backoffice, Supabase, n8n y `ONBOARDING_DISPATCH_WEBHOOK_URL`
- frontend: `VITE_API_URL` en `src/frontend/.env.example`
- integraciones: URLs y credenciales separadas por entorno

## Comprobacion minima tras cambios de despliegue del backend

Si cambia `render.yaml`, cualquier variable de entorno de Render o la ruta de un webhook real:

1. comprobar `GET /api/health`,
2. activar onboarding desde backoffice sobre un cliente listo,
3. guardar el `correlation_id` devuelto por backend,
4. confirmar fila en `automation_events`,
5. confirmar fila en `ejecuciones_workflows`,
6. verificar el mismo `correlation_id` y estado `completed`.

Automatizacion recomendada:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-onboarding-flow.ps1 -ClientId "<uuid-del-cliente>"
```

Este script ya corta antes de activar onboarding si `/api/system/status` no devuelve `onboardingDispatch.configured = true` y `pathStatus = expected`.

Wrapper recomendado para comprobacion completa:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-onboarding-operational-check.ps1 -ClientId "<uuid-del-cliente>"
```

Control especifico actual:

- `ONBOARDING_DISPATCH_WEBHOOK_URL` debe apuntar a `https://quinttanaaa.app.n8n.cloud/webhook/onboarding_activated`
- `render.yaml` y la configuracion manual del servicio en Render deben permanecer sincronizados

## Control especifico del bloque actual

Bloque activo previsto para despliegue controlado:

- `automation_client_invoice_cancel`

Estado actual del bloque:

- el workflow ya esta publicado en n8n Cloud con la ruta `/webhook/automation_client_invoice_cancel`
- la validacion extremo a extremo ya ha pasado tanto desde backend local con servicios reales como desde backend desplegado
- la rama reversible `pendiente -> cancelada -> pendiente` queda cerrada operativamente en local y en remoto

Precondiciones minimas que se usaron para la validacion contra backend desplegado:

- el backend desplegado debe incluir el soporte para `template=client_invoice_cancel`
- la credencial Supabase activa en n8n debe poder leer y actualizar `facturas`
- debe existir al menos una factura `pendiente` valida para el cliente objetivo

Validacion operativa recomendada para futuras revalidaciones:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-client-invoice-cancel-automation.ps1 -ClientId "<uuid-del-cliente>"
```

Esta validacion debe confirmar:

- provisionado idempotente de `client_invoice_cancel`
- ejecucion aceptada por backend y workflow
- fila `completed` en `ejecuciones_workflows`
- fila `exito` en `ejecuciones`
- cambio real de `facturas.estado` a `cancelada`
- rollback por el mismo workflow hasta `pendiente` con un segundo `correlation_id`

## Alcance confirmado del despliegue versionado

- `render.yaml` cubre solo el backend Express
- la configuracion de frontend desplegado queda `Pendiente de validar` mas alla de la documentacion existente
- el flujo de CI/CD queda `Pendiente de validar` si vive fuera del repositorio

## Reglas

- no desplegar produccion sin confirmacion del usuario,
- no asumir que staging y produccion comparten credenciales,
- no dejar cambios de despliegue sin documentar.

## Pendiente de validar

- flujo exacto de despliegue productivo actualmente utilizado
- pipeline de CI/CD si existe fuera del repositorio
