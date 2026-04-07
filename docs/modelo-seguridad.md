# Modelo de seguridad

## Proposito

Este documento define la base de seguridad del repositorio y del futuro sistema de automatizacion. Su objetivo es reducir riesgos tempranos, establecer limites claros entre capas y preparar una evolucion auditable.

## Principios base

- minimo privilegio por defecto,
- separacion de responsabilidades por capa,
- secretos fuera del repositorio,
- trazabilidad obligatoria de eventos y ejecuciones,
- cambios conservadores y reversibles.

## Politica de variables de entorno

- todas las variables sensibles deben residir fuera del codigo fuente,
- `.env.example` solo contiene placeholders,
- las variables deben separarse por entorno: local, staging y produccion,
- las variables de frontend deben limitarse a datos estrictamente publicos,
- las variables privilegiadas deben quedar restringidas a backend o serverless.

## Gestion de credenciales

- no almacenar credenciales reales en el repositorio,
- no reutilizar la misma credencial en varios entornos,
- service role keys solo para backend o funciones controladas,
- rotar credenciales cuando una integracion pase a produccion,
- documentar el uso de cada secreto sin exponer su valor.

## Principio de minimo privilegio

Aplicacion por capa:

- Node.js: acceso limitado a las integraciones y operaciones necesarias
- Supabase: permisos limitados por tabla, funcion y entorno
- n8n: credenciales separadas por workflow y servicio cuando sea viable
- Rendel.com: agentes con acceso solo al contexto necesario
- Vercel: funciones y variables limitadas al caso de uso
- Codex: cambios dentro del repositorio y documentacion de decisiones

## Registro de eventos

Todo evento relevante del sistema debe poder registrarse con:

- `correlation_id`
- origen del evento
- tipo de evento
- payload normalizado
- marca temporal
- estado de procesamiento

## Registro de ejecuciones de workflows

Cada workflow debe poder registrarse con:

- nombre y version
- trigger de origen
- identificador de ejecucion
- `correlation_id`
- estado final
- tiempos de inicio y fin
- error resumido si existe

## Registro de ejecuciones de agentes

Cada agente debe poder registrarse con:

- nombre y version
- proveedor o entorno de agente
- `correlation_id`
- workflow o proceso origen
- resultado estructurado
- errores o advertencias
- duracion de ejecucion

## Separacion backend vs orchestration vs deployment

### Backend

Responsable:
Node.js

Limite:
logica de aplicacion, integraciones, adaptadores y endpoints intermedios.

### Datos y persistencia

Responsable:
Supabase

Limite:
persistencia, estado, datos y control de acceso.

### Orchestration

Responsable:
n8n

Limite:
secuencia de procesos, integraciones y coordinacion operativa.

### Deployment

Responsable:
Vercel

Limite:
exposicion de frontend, endpoints y funciones serverless.

### Agentes

Responsable:
Rendel.com

Limite:
tareas de clasificacion, analisis, generacion o apoyo contextual.

## Reglas de seguridad operativa

- no exponer service role keys al frontend,
- no convertir n8n ni Vercel en sustitutos del backend principal de aplicacion,
- no activar workflows o agentes productivos sin logs minimos definidos,
- no conectar integraciones reales sin separar entornos,
- no persistir secretos dentro de payloads de eventos o logs,
- no mezclar datos reales con entornos de prueba sin control formal.

## Controles minimos antes de integraciones reales

- variables de entorno separadas por entorno,
- permisos documentados por capa,
- tablas de trazabilidad definidas,
- endpoints revisados y autenticados,
- checklist previa a despliegue completada.

## Estado actual

Modelo base definido para endurecer seguridad del repositorio antes de iniciar integraciones reales.
