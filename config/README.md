# Config

Esta carpeta documenta la configuracion operativa y las variables de entorno del proyecto.

## Variables base previstas

### Backend Node.js

- `NODE_ENV`
- `PORT`
- `BASE_API_PATH`

### Supabase

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### n8n

- `N8N_WEBHOOK_BASE_URL`

### Rendel

- `RENDEL_API_KEY`

### Vercel

- `VERCEL_PROJECT_ID`
- `VERCEL_ORG_ID`
- `VERCEL_TOKEN`

## Criterios

- No almacenar secretos reales en el repositorio.
- Mantener `.env.example` como referencia publica.
- Documentar nuevas variables aqui cuando se anadan modulos o servicios.
- Separar variables por entorno: local, staging y produccion.
- Restringir variables privilegiadas a backend o funciones serverless.

## Estado actual

Configuracion inicial pendiente de concretar por entorno.
