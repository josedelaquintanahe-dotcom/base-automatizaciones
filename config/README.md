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
- `PORT`
- `BASE_API_PATH`

Nota:
si no se informan manualmente, el backend actual puede arrancar con valores seguros por defecto en local:

- `NODE_ENV=development`
- `PORT=3000`
- `BASE_API_PATH=/api`

## Obligatorias en staging y produccion

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_BASE_URL`
- `RENDEL_API_KEY`
- `VERCEL_PROJECT_ID`
- `VERCEL_ORG_ID`
- `VERCEL_TOKEN`

## Opcionales en local y test

En `development` y `test`, las variables de integracion anteriores pueden faltar mientras no se inicien integraciones reales. El backend arranca, pero muestra advertencias claras.

### Backend Node.js

- `NODE_ENV`
- `PORT`
- `BASE_API_PATH`

Proposito:

- `NODE_ENV`: define el entorno de ejecucion del backend, por ejemplo `development`, `staging` o `production`.
- `PORT`: puerto local o persistente en el que escucha el servidor Express.
- `BASE_API_PATH`: prefijo base de las rutas HTTP del backend, por ejemplo `/api`.

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

Proposito:

- `N8N_WEBHOOK_BASE_URL`: URL base de webhooks de n8n para invocacion de workflows desde backend o despliegue.

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

- deben existir todas las variables de integracion,
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

- `.env.example` completo,
- defaults seguros para arranque local,
- validacion de entorno en el backend.

Pendiente:

- cargar valores reales por entorno fuera del repositorio,
- conectar integraciones reales,
- validar credenciales y permisos en staging y produccion.
