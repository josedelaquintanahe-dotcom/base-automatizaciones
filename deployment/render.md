# Render

## Proposito

Este documento define la configuracion minima para desplegar el backend Express en Render sin alterar el entorno local del repositorio.

## Estructura adoptada

- `render.yaml` vive en la raiz del repositorio.
- El servicio web usa `rootDir: src/backend`.
- El backend mantiene sus comandos actuales:
  - build: `npm install`
  - start: `npm start`
- `src/backend/.env.local` sigue reservado para desarrollo local y no participa en Render.

## Variables exactas a definir en Render

### Obligatorias

- `NODE_ENV=production`
- `BASE_API_PATH=/api`
- `CORS_ALLOWED_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_BASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `BACKOFFICE_API_TOKEN`

### Gestionadas por Render

- `PORT`

Render proporciona `PORT` automaticamente para web services. El backend ya lo consume mediante `process.env.PORT`.

### Opcionales

- `HOST`

No hace falta definir `HOST` en Render salvo que se quiera forzar manualmente. En `production` y `staging` el backend escucha por defecto en `0.0.0.0`.

## Valor recomendado de CORS

`CORS_ALLOWED_ORIGINS` debe contener los origenes exactos del frontend administrativo separados por comas.

Ejemplo:

`https://admin.midominio.com,https://preview-admin.midominio.com`

## Validacion previa al despliegue

1. Confirmar que `GET /api/health` responde correctamente.
2. Confirmar que `GET /api/system/status` funciona con las variables reales del entorno.
3. Confirmar que `GET /api/clientes` responde `401` sin token y `200` con `BACKOFFICE_API_TOKEN`.
4. Confirmar que el frontend usa el dominio real incluido en `CORS_ALLOWED_ORIGINS`.
