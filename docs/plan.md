# Plan tecnico inicial

## Proposito del plan

Este documento debe servir como referencia previa antes de implementar cambios estructurales importantes en el repositorio. Su objetivo es fijar una arquitectura esperada, identificar dependencias necesarias y definir un orden de implementacion que reduzca acoplamientos, retrabajo y deriva tecnica.

## Regla de uso

Antes de introducir una nueva capa, modulo, integracion o cambio arquitectonico relevante, se debe revisar este plan y actualizarlo si el alcance del proyecto cambia de forma material.

## Arquitectura esperada

La arquitectura objetivo del sistema se organiza en cinco dominios principales:

### 1. Backend y persistencia

Responsable:
Supabase

Funcion esperada:

- almacenar datos operativos y de negocio,
- conservar estados y trazabilidad,
- servir como fuente de verdad del sistema,
- exponer acceso controlado a datos para workflows, agentes y frontend.

### 2. Orquestacion de procesos

Responsable:
n8n

Funcion esperada:

- coordinar eventos, reglas y secuencias de automatizacion,
- integrar servicios internos y externos,
- invocar agentes cuando el caso lo requiera,
- registrar resultado y estado en Supabase.

### 3. Capa de agentes

Responsable:
Rendel.com

Funcion esperada:

- ejecutar agentes especializados por tarea,
- procesar contexto acotado y devolver salidas estructuradas,
- complementar a n8n en tareas no deterministas.

### 4. Exposicion y despliegue

Responsable:
Vercel

Funcion esperada:

- alojar frontend si existe,
- exponer funciones serverless y endpoints de integracion,
- servir como punto de entrada controlado para usuarios y sistemas externos.

### 5. Repositorio estructural

Responsable:
Codex

Funcion esperada:

- mantener la estructura del repositorio,
- asegurar consistencia documental,
- registrar decisiones tecnicas,
- facilitar evolucion modular y reutilizable.

## Dependencias necesarias

## Dependencias de plataforma

- proyecto Supabase operativo o planificado
- instancia o entorno de n8n disponible
- cuenta o entorno en Rendel.com para agentes
- proyecto Vercel para despliegues serverless y frontend
- repositorio local organizado y mantenido por Codex

## Dependencias tecnicas minimas

- variables de entorno definidas en `.env.example`
- esquema base documentado en `database/schema.md`
- estandar de workflows documentado en `workflows/README.md`
- estandar de agentes documentado en `agents/README.md`
- base de despliegue documentada en `deployment/README.md`
- decisiones estructurales registradas en `docs/decisiones.md`

## Dependencias por capa

### Supabase

- definicion de tablas base
- estrategia de acceso y permisos
- convencion para logs, eventos y ejecuciones

### n8n

- nomenclatura de workflows
- estrategia de triggers
- estructura de logs y correlacion

### Rendel.com

- definicion de tipos de agentes
- formato de entrada y salida
- criterio de invocacion desde workflows o backend

### Vercel

- estructura de endpoints
- estructura de frontend si aplica
- separacion entre variables publicas y privadas

## Orden recomendado de implementacion

### Fase 1. Base estructural del repositorio

- consolidar carpetas y documentacion base,
- asegurar reglas de mantenimiento en `AGENTS.md`,
- fijar convenciones iniciales y criterios de seguridad.

Resultado esperado:
repositorio listo para crecer sin ambiguedad estructural.

### Fase 2. Modelo base de datos en Supabase

- definir tablas tecnicas transversales,
- preparar esquema inicial del dominio de negocio,
- documentar relaciones, estados e indices.

Resultado esperado:
fuente de verdad preparada para soportar workflows, agentes y frontend.

### Fase 3. Estandarizacion de workflows n8n

- definir naming, triggers y logs,
- identificar workflows base reutilizables,
- documentar dependencias con Supabase y agentes.

Resultado esperado:
capa de orquestacion preparada para crecer con trazabilidad.

### Fase 4. Estandarizacion de agentes

- definir tipos de agentes reutilizables,
- establecer entradas, salidas y estructura de ejecucion,
- fijar integracion con n8n y registro en Supabase.

Resultado esperado:
capa de agentes controlada, auditable y desacoplada.

### Fase 5. Base de despliegue en Vercel

- definir endpoints serverless,
- estructurar frontend si es necesario,
- conectar variables y flujos con Supabase y n8n.

Resultado esperado:
capa de exposicion estable y segura.

### Fase 6. Integraciones externas

- documentar APIs y servicios externos,
- definir contratos, autenticacion y reintentos,
- conectar integraciones a workflows y registros tecnicos.

Resultado esperado:
sistema preparado para casos de uso empresariales concretos.

### Fase 7. Observabilidad y operacion

- consolidar logs tecnicos,
- definir alertas y verificaciones,
- establecer criterios de soporte y mantenimiento.

Resultado esperado:
sistema operable y medible en entornos reales.

## Secuencia recomendada para cambios estructurales importantes

1. Definir el objetivo del cambio.
2. Identificar que capa afecta: Supabase, n8n, agentes, Vercel o repositorio.
3. Revisar dependencias previas.
4. Actualizar este plan si el cambio altera la arquitectura esperada.
5. Registrar la decision en `docs/decisiones.md`.
6. Implementar cambios por capas, evitando mezclar varias sin trazabilidad.
7. Actualizar la documentacion del modulo afectado.

## Prioridades iniciales del proyecto

- completar base documental y modular,
- preparar esquema de datos transversal,
- fijar estandares de workflows y agentes,
- dejar lista la capa de despliegue en Vercel,
- preparar integraciones futuras sin introducir complejidad prematura.

## Estado actual

Plan base definido para guiar la evolucion del repositorio antes de cualquier cambio estructural importante.
