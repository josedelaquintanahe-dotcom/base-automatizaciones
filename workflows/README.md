# Workflows

Esta carpeta define la estructura estandar para documentar y organizar workflows de n8n dentro de proyectos de automatizacion empresarial.

## Objetivo

- establecer una convencion reutilizable para futuros proyectos,
- facilitar trazabilidad y mantenimiento de workflows,
- separar claramente triggers, proceso, outputs, logs y dependencias,
- asegurar coherencia entre automatizaciones de distintos dominios.

## Principios base

- cada workflow debe tener un objetivo unico y claramente definido,
- la orquestacion vive en n8n, no en el frontend,
- el estado final del negocio debe persistirse en Supabase cuando aplique,
- los errores y resultados relevantes deben quedar trazables,
- la nomenclatura debe permitir localizar rapido el workflow por dominio y funcion.

## Estructura de naming recomendada

Formato sugerido:

`[dominio]__[tipo]__[accion]__[version]`

Ejemplos:

- `sales__trigger__lead_created__v1`
- `billing__process__invoice_sync__v1`
- `support__agent__ticket_classification__v1`
- `ops__scheduled__daily_health_check__v1`

## Tipos de triggers recomendados

- webhook trigger
- schedule trigger
- database trigger
- manual trigger
- workflow-to-workflow trigger

## Estructura recomendada dentro de cada workflow

1. Trigger de entrada
2. Normalizacion de datos
3. Validaciones
4. Consulta de contexto en Supabase o servicios necesarios
5. Ejecucion de logica principal
6. Invocacion de agentes o integraciones externas si aplica
7. Persistencia de resultado y estado
8. Registro de logs y salida final

## Estructura de outputs recomendada

Salida minima sugerida:

- `status`
- `correlation_id`
- `workflow_name`
- `workflow_version`
- `result_summary`
- `next_action` nullable
- `error_summary` nullable

Regla:
Las salidas deben ser estructuradas y previsibles para facilitar integracion con Supabase, otros workflows o capas de frontend.

## Estructura de logs recomendada

Informacion minima a registrar:

- nombre del workflow
- version del workflow
- identificador de ejecucion de n8n
- `correlation_id`
- trigger de origen
- estado final
- tiempo de inicio y fin
- resumen de error si existe

## Reglas para logging

- no registrar secretos ni credenciales,
- registrar payloads completos solo cuando sea necesario y seguro,
- normalizar mensajes de error para facilitar soporte,
- enviar logs tecnicos relevantes a la tabla de logs definida en Supabase cuando aplique,
- reutilizar `correlation_id` para conectar evento, workflow, agente y log.

## Estructura de versionado recomendada

- mantener una version visible en el nombre del workflow o en su documentacion asociada,
- registrar cambios funcionales relevantes al pasar de `v1` a `v2` y sucesivas,
- no sobrescribir comportamientos criticos sin dejar trazabilidad documental,
- actualizar dependencias y outputs cuando cambie la version.

## Tipos de workflows esperados en proyectos de automatizacion empresarial

- workflows de entrada
- workflows de sincronizacion
- workflows operativos
- workflows con agentes
- workflows de monitorizacion y alertas
- workflows de mantenimiento

## Ficha recomendada para documentar cada workflow

- nombre del workflow
- objetivo
- dominio
- trigger
- entradas
- salidas
- tablas afectadas en Supabase
- integraciones implicadas
- agentes implicados si existen
- estrategia de logs
- estrategia de reintentos
- estado de despliegue
- responsable de mantenimiento

## Criterios de reutilizacion

- separar workflows por responsabilidad y no por conveniencia temporal,
- reutilizar subflujos o workflows auxiliares para tareas comunes,
- mantener versionado visible en el nombre o documentacion,
- evitar logica de negocio opaca dentro de nodos dificilmente auditables,
- documentar cualquier decision estructural importante cuando se introduzca un nuevo patron.

## Estado actual

Guia base definida para documentar y estandarizar workflows n8n en futuros proyectos de automatizacion empresarial.

Workflow preparado actualmente:

- `onboarding__webhook__onboarding_activated__v1`
