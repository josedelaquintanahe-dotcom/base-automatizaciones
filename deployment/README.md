# Deployment

Esta carpeta define la estructura base para despliegues en Vercel dentro de proyectos de automatizacion empresarial.

## Objetivo

- establecer una base reutilizable para despliegue serverless y frontend,
- separar claramente funciones expuestas, interfaz y configuracion,
- documentar variables de entorno y endpoints de integracion,
- mantener coherencia con Supabase, Node.js, n8n y la arquitectura modular del repositorio.

## Estructura Vercel recomendada

- `src/`
- `src/app/` o `src/pages/`
- `src/components/`
- `src/lib/`
- `src/lib/supabase/`
- `src/lib/api/`
- `src/lib/config/`
- `api/`
- `api/health/`
- `api/hooks/`
- `api/integrations/`
- `api/internal/`

## Convivencia entre Node.js backend y Vercel serverless

El backend Node.js y Vercel pueden convivir sin duplicar responsabilidades.

Uso recomendado de backend persistente:

- servidor Express principal,
- logica de negocio reutilizable,
- integraciones externas complejas,
- adaptadores entre Supabase y n8n,
- control de agentes,
- procesos que necesiten estructura mantenible y crecimiento progresivo.

Uso recomendado de funciones serverless:

- endpoints ligeros de entrada,
- callbacks simples,
- health checks,
- adaptadores muy pequenos ligados al frontend o al despliegue.

Regla:
si una pieza de logica empieza a crecer o a reutilizarse entre varios puntos, debe moverse preferentemente al backend Node.js.

## Cuando usar Express backend persistente

- cuando la API tenga varias rutas o dominios,
- cuando existan middlewares comunes y manejo centralizado de errores,
- cuando la logica necesite reutilizacion y estructura por capas,
- cuando una integracion requiera continuidad operativa mayor que una funcion aislada.

## Cuando usar funciones serverless en Vercel

- cuando el endpoint sea puntual y ligero,
- cuando se trate de una entrada muy acotada del frontend,
- cuando el coste operativo de un backend persistente no aporte valor para ese caso,
- cuando no se duplique logica que ya deba vivir en Express.

## Estructura de funciones serverless

Las funciones serverless deben concentrarse en adaptadores de entrada y salida, no en procesos largos o logica difusa.

Categorias recomendadas:

- `api/health/`
- `api/hooks/`
- `api/integrations/`
- `api/internal/`

## Estructura recomendada para cada funcion serverless

1. validacion de metodo y autenticacion
2. validacion de entrada
3. generacion o propagacion de `correlation_id`
4. transformacion minima del payload
5. llamada a Supabase, n8n o servicio correspondiente
6. manejo normalizado de errores
7. respuesta estructurada
8. registro tecnico si aplica

## Estructura frontend si es necesario

El frontend en Vercel es opcional, pero cuando exista debe actuar como capa de experiencia y operacion.

Responsabilidades del frontend:

- mostrar estado de procesos o entidades,
- capturar acciones de usuario,
- invocar endpoints serverless o APIs seguras,
- presentar informacion consolidada desde Supabase o flujos ya procesados.

## Estructura de variables de entorno

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

## Estructura de endpoints de integracion con Supabase y n8n

Patrones recomendados:

- lectura controlada desde frontend con permisos limitados,
- escritura sensible desde funciones serverless,
- reenvio a webhook de n8n con validacion previa,
- propagacion de `correlation_id` entre capas,
- respuestas estructuradas y auditables.

Ejemplos de endpoints:

- `api/internal/entity-status`
- `api/internal/dashboard-summary`
- `api/hooks/create-request`
- `api/hooks/lead-created`
- `api/hooks/ticket-created`
- `api/integrations/manual-reprocess`

## Separacion preview vs produccion

### Preview

- validacion de cambios antes de publicar,
- uso de variables y endpoints del entorno no productivo,
- pruebas funcionales y de interfaz sin impacto real.

### Produccion

- uso exclusivo para operacion real,
- variables y endpoints productivos separados,
- despliegues sujetos a checklist previa y criterio conservador.

## Reglas de seguridad

- no exponer service role keys al frontend,
- no usar variables de produccion en preview,
- no exponer endpoints internos sin control de acceso,
- documentar cada endpoint nuevo con su objetivo, autenticacion y dependencias.

## Estado actual

Guia base definida para estructurar despliegues en Vercel, funciones serverless, frontend opcional y endpoints de integracion con Supabase y n8n.
