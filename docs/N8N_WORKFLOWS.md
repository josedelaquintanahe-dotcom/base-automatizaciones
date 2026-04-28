# N8N_WORKFLOWS.md

## Objetivo

Servir como indice base para workflows n8n y como plantilla documental para futuros flujos.

## Estado de vigencia

Este documento funciona como indice canonico resumido. El detalle operativo principal del workflow actual vive en `workflows/onboarding__webhook__onboarding_activated__v1.md`.

## Workflow detectado

### `onboarding_activated`

- documento fuente: `workflows/onboarding__webhook__onboarding_activated__v1.md`
- estado detectado: documentado en repositorio y creado en n8n Cloud
- trigger: webhook `POST`
- objetivo: registrar trazabilidad tecnica de onboarding activado
- persistencia esperada: `automation_events` y `ejecuciones_workflows`

## Plantilla recomendada para cada workflow

- nombre logico del workflow
- archivo fuente en repositorio
- objetivo
- trigger
- payload de entrada
- credenciales necesarias
- tablas o sistemas afectados
- respuestas esperadas
- estrategia de error y reintentos
- trazabilidad y uso de `correlation_id`
- prueba recomendada

## Reglas

- no dejar workflows sin documentar,
- no mezclar nombres internos y nombres logicos sin explicacion,
- no inventar credenciales ni exportar secretos,
- mantener alineado workflow real y documento fuente.

## Pendiente de validar

- export JSON versionado en `n8n/workflows/` si se decide formalizar ese flujo
- catalogo ampliado de workflows futuros
- estrategia estable para versionar workflows reales entre repositorio y n8n Cloud
