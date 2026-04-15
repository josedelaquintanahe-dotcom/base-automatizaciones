# Configuracion del servidor

## Proposito

Este archivo documenta las variables de configuracion esperadas para el futuro servidor Express.

## Variables necesarias futuras

- `PORT`
- `NODE_ENV`
- `HOST`
- `BASE_API_PATH`
- `CORS_ALLOWED_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_BASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `BACKOFFICE_API_TOKEN`

## Descripcion

### `PORT`

Puerto de escucha del backend en entorno local o persistente.

### `NODE_ENV`

Entorno de ejecucion del backend, por ejemplo `development`, `staging` o `production`.

### `HOST`

Host de escucha del backend. En staging o produccion se resuelve por defecto a `0.0.0.0` para compatibilidad con Render. En local se mantiene el comportamiento actual si no se define.

### `BASE_API_PATH`

Prefijo base de las rutas HTTP del backend. Valor inicial recomendado:

`/api`

## Regla

Estas variables deben cargarse por entorno y nunca contener secretos incrustados en el repositorio.
