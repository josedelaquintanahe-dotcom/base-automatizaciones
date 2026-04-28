# DEPLOYMENT.md

## Objetivo

Reunir una guia base de despliegue sin asumir mas alla de lo detectado en el repositorio.

## Detectado

- frontend preparado con Vite
- backend preparado para Node.js/Express
- `render.yaml` presente para backend
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
- `.env.example` alineado con variables reales del codigo
- `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md` actualizados
- endpoints, webhooks y tablas documentados
- riesgos de seguridad revisados

## Variables a revisar por entorno

- backend: Node, CORS, JWT, cifrado, backoffice, Supabase, n8n
- frontend: `VITE_API_URL`
- integraciones: URLs y credenciales separadas por entorno

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
