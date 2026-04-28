# Config

Esta carpeta documenta la configuracion operativa y las variables de entorno del proyecto.

## Variables base previstas

## Archivo local recomendado

Para desarrollo local del backend, las variables privadas deben guardarse en:

- `src/backend/.env.local`

Reglas:

- este archivo es local y no debe subirse al repositorio,
- `.env.example` sigue siendo la referencia publica,
- `src/backend/.env.local` solo se carga automaticamente en entorno `development`.

## Obligatorias para arrancar el backend

- `NODE_ENV`
- `HOST`
- `PORT`
- `BASE_API_PATH`
- `CORS_ALLOWED_ORIGINS`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `BACKOFFICE_API_TOKEN`
- `ONBOARDING_DISPATCH_WEBHOOK_URL`

Nota:
si no se informan manualmente, el backend actual puede arrancar con valores seguros por defecto en local para una parte de estas variables:

- `NODE_ENV=development`
- `PORT=3000`
- `BASE_API_PATH=/api`

En local:

- `HOST` puede quedar vacio,
- `CORS_ALLOWED_ORIGINS` puede quedar vacio porque el backend aplica defaults de desarrollo,
- `JWT_SECRET`, `BACKOFFICE_API_TOKEN` y `ONBOARDING_DISPATCH_WEBHOOK_URL` pueden faltar si no se ejecutan flujos reales dependientes de ellos,
- `ENCRYPTION_KEY` deberia configurarse si se van a usar operaciones reales de cifrado.

## Obligatorias en staging y produccion

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_BASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `BACKOFFICE_API_TOKEN`
- `CORS_ALLOWED_ORIGINS`

## Opcionales en local y test

En `development` y `test`, las variables de integracion pueden faltar mientras no se inicien integraciones reales. El backend arranca, pero muestra advertencias claras.

### Backend Node.js

- `NODE_ENV`
- `HOST`
- `PORT`
- `BASE_API_PATH`
- `CORS_ALLOWED_ORIGINS`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `BACKOFFICE_API_TOKEN`
- `ONBOARDING_DISPATCH_WEBHOOK_URL`

Proposito:

- `NODE_ENV`: define el entorno de ejecucion del backend, por ejemplo `development`, `staging` o `production`.
- `HOST`: host explicito de escucha; en `staging` y `production` el backend usa `0.0.0.0` por defecto si no se define.
- `PORT`: puerto local o persistente en el que escucha el servidor Express.
- `BASE_API_PATH`: prefijo base de las rutas HTTP del backend, por ejemplo `/api`.
- `CORS_ALLOWED_ORIGINS`: lista separada por comas de origenes permitidos; en `development` existen defaults seguros para `localhost`.
- `JWT_SECRET`: secreto usado por autenticacion o validaciones internas del backend.
- `ENCRYPTION_KEY`: clave requerida por las utilidades de cifrado del backend.
- `BACKOFFICE_API_TOKEN`: bearer token reservado para endpoints administrativos internos.
- `ONBOARDING_DISPATCH_WEBHOOK_URL`: URL absoluta opcional del webhook real de onboarding en n8n.

### Supabase

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Proposito:

- `SUPABASE_URL`: URL base del proyecto Supabase del entorno correspondiente.
- `SUPABASE_ANON_KEY`: clave publica para accesos limitados o flujos controlados.
- `SUPABASE_SERVICE_ROLE_KEY`: clave privilegiada para backend o procesos server-side estrictamente necesarios.

### n8n

- `N8N_WEBHOOK_BASE_URL`
- `ONBOARDING_DISPATCH_WEBHOOK_URL`

Proposito:

- `N8N_WEBHOOK_BASE_URL`: URL base de webhooks de n8n para invocacion de workflows desde backend o despliegue.
- `ONBOARDING_DISPATCH_WEBHOOK_URL`: webhook especifico y versionado para el evento `onboarding_activated`.

### Rendel

- `RENDEL_API_KEY`

Proposito:

- `RENDEL_API_KEY`: clave de acceso del backend para invocar agentes o servicios de Rendel.com.

### Vercel

- `VERCEL_PROJECT_ID`
- `VERCEL_ORG_ID`
- `VERCEL_TOKEN`

Proposito:

- `VERCEL_PROJECT_ID`: identificador del proyecto en Vercel.
- `VERCEL_ORG_ID`: identificador de organizacion o equipo en Vercel.
- `VERCEL_TOKEN`: token de acceso para automatizaciones o integraciones backend con Vercel.

## Diferencias por entorno

### Local

- se permiten valores por defecto seguros para arranque,
- las variables de integracion pueden quedar vacias,
- las variables reales de desarrollo deben guardarse en `src/backend/.env.local`,
- no deben usarse credenciales reales si no son necesarias para desarrollo.

### Staging

- deben existir todas las variables obligatorias del backend,
- se deben usar credenciales y endpoints propios de staging,
- el backend no debe arrancar con configuracion incompleta.

### Produccion

- deben existir todas las variables obligatorias,
- deben usarse solo valores del entorno productivo,
- cualquier ausencia o valor invalido debe bloquear el arranque.

## Criterios

- No almacenar secretos reales en el repositorio.
- Mantener `.env.example` como referencia publica.
- Documentar nuevas variables aqui cuando se anadan modulos o servicios.
- Separar variables por entorno: local, staging y produccion.
- Restringir variables privilegiadas a backend o funciones serverless.

## Estado actual

Configuracion base cerrada para desarrollo local y preparada para separar `local`, `staging` y `production`.

Implementado:

- `.env.example` alineado con las variables reales del backend,
- defaults seguros para arranque local,
- validacion de entorno en el backend.

Pendiente:

- cargar valores reales por entorno fuera del repositorio,
- conectar integraciones reales,
- validar credenciales y permisos en staging y produccion.
