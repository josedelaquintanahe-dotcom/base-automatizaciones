# Agents

Esta carpeta define la estructura estandar para documentar agentes automatizados creados con Rendel.com dentro de proyectos de automatizacion empresarial.

## Objetivo

- establecer una convencion reutilizable para agentes,
- diferenciar claramente el rol de los agentes frente a los workflows de n8n,
- facilitar trazabilidad de ejecucion, contexto y resultados,
- permitir evolucion del sistema sin perder control documental.

## Estructura de naming recomendada

Formato sugerido:

`[dominio]__[tipo]__[objetivo]__[version]`

Ejemplos:

- `support__classifier__ticket_priority__v1`
- `sales__enricher__lead_profile__v1`
- `ops__analyst__incident_summary__v1`
- `shared__generator__response_draft__v1`

## Tipos de agentes reutilizables

- `classifier`
- `enricher`
- `analyst`
- `generator`
- `router`
- `validator`
- `assistant`

## Responsabilidades del agente

- resolver una tarea concreta de clasificacion, analisis, generacion o validacion,
- trabajar con contexto minimo necesario,
- devolver salidas estructuradas y auditables,
- no asumir persistencia final de estado ni orquestacion global.

## Estructura de ejecucion recomendada

1. Recepcion de contexto de entrada
2. Validacion minima de datos requeridos
3. Normalizacion del contexto
4. Ejecucion del agente en Rendel.com
5. Recepcion de salida estructurada
6. Validacion de salida
7. Persistencia o derivacion del resultado fuera del agente
8. Registro de ejecucion y logs

## Inputs recomendados

- `correlation_id`
- nombre del proceso o workflow origen
- contexto de negocio necesario
- instrucciones del agente
- restricciones de salida
- metadatos de ejecucion

## Outputs recomendados

- resultado principal estructurado
- nivel de confianza si aplica
- justificacion resumida si aplica
- estado de ejecucion
- errores o advertencias detectadas

## Estructura de logs recomendada

- nombre del agente
- version del agente
- proveedor o plataforma de ejecucion
- identificador de ejecucion del proveedor si existe
- `correlation_id`
- workflow o proceso origen
- estado final
- tiempo de inicio y fin
- resumen de error si existe

## Limites de ejecucion recomendados

- limitar el contexto enviado al minimo necesario,
- evitar dependencias implicitas con otros agentes,
- no permitir acciones destructivas o irreversibles desde el propio agente sin capa de control externa,
- definir tiempos de espera y criterios de error antes de integrarlo en procesos productivos,
- exigir validacion posterior cuando la salida del agente afecte decisiones sensibles.

## Relacion recomendada con n8n y Supabase

- n8n debe invocar al agente cuando el caso requiera razonamiento o interpretacion,
- Supabase debe almacenar el resultado final y la trazabilidad relevante,
- el agente no debe ser la fuente de verdad del sistema,
- los resultados del agente deben poder validarse antes de consolidarse.

## Ficha recomendada para documentar cada agente

- nombre del agente
- objetivo
- dominio
- tipo de agente
- trigger o proceso que lo invoca
- entradas esperadas
- salidas esperadas
- restricciones o reglas
- dependencias externas
- estrategia de logs
- criterios de exito
- estado de despliegue
- responsable de mantenimiento

## Estado actual

Guia base definida para documentar y estandarizar agentes automatizados creados con Rendel.com en futuros proyectos de automatizacion empresarial.
