# CONTEXT.md

## 1. Descripcion general del proyecto

`base-automatizaciones` es una base operativa para construir, documentar y mantener automatizaciones empresariales sobre Windows. El repositorio combina documentacion estructural, backend Node.js, frontend React, modelo de datos en Supabase y workflows de n8n.

## 2. Objetivo de negocio

Convertir este repositorio en una plataforma reutilizable para analizar, vender, construir y operar automatizaciones empresariales con trazabilidad, seguridad y documentacion suficiente para equipos humanos y agentes Codex.

## 3. Problema general que resuelve

Muchas empresas operan procesos manuales, dispersos entre correo, hojas de calculo, APIs, facturacion y sistemas internos. Este proyecto busca dar una base comun para integrar esos procesos con backend, Supabase, n8n y documentacion operativa.

## 4. Alcance funcional esperado

El alcance detectado y previsto incluye:

- gestion de clientes,
- backoffice interno,
- automatizaciones asociadas a clientes,
- ejecucion y trazabilidad de workflows,
- integracion backend -> Supabase -> n8n,
- documentacion tecnica, operativa y comercial,
- sistema de agentes y playbooks para Codex.

## 5. Stack tecnico previsto y detectado

Detectado en el repositorio:

- Windows + PowerShell como entorno principal
- Git + GitHub
- Backend Node.js + Express en `src/backend`
- Frontend React + Vite en `src/frontend`
- Supabase como base de datos e integracion server-side
- n8n como motor de workflows
- Render y Vercel documentados como despliegue

Pendiente de validar:

- uso real de Rendel.com mas alla de preparacion estructural
- despliegue productivo definitivo de cada componente

## 6. Estado actual del proyecto

Detectado:

- backend funcional con tests y lint disponibles
- frontend funcional con tests, lint y build
- cliente real de Supabase ya integrado
- workflow `onboarding_activated` documentado y existente en n8n Cloud
- sistema de skills y playbooks ya estructurado en `.codex/`
- documentacion estructural previa en `docs/`, `database/`, `deployment/` y `workflows/`

Pendiente principal:

- mantener sincronizado el sistema documental de agentes y diagnostico sin tocar logica del producto

## 7. Decisiones tomadas

La fuente oficial de decisiones es `docs/decisiones.md`.

Resumen de decisiones relevantes detectadas:

- el repo funciona como plantilla reutilizable,
- el backend Node.js centraliza logica e integraciones,
- Supabase es la persistencia principal,
- n8n coordina workflows y no debe sustituir al backend,
- la seguridad prioriza minimo privilegio y exclusion de secretos,
- el workflow inicial de onboarding usa `automation_events` y `ejecuciones_workflows` para trazabilidad.

## 8. Principios de desarrollo

- modularidad por dominio,
- cambios pequenos y auditables,
- compatibilidad con Windows,
- seguridad por defecto,
- documentacion alineada con la realidad del repo,
- no inventar estado tecnico no verificado.

## 9. Reglas de seguridad

- no versionar secretos reales,
- no exponer credenciales en frontend,
- no modificar produccion sin confirmacion,
- revisar impacto de Supabase, n8n, webhooks y tokens antes de cambios sensibles,
- marcar como `Pendiente de validar` lo no confirmado.

## 10. Reglas de Git y GitHub

- no hacer commit ni push salvo peticion expresa,
- revisar `git status` y diff antes de cerrar un bloque,
- no mezclar cambios no relacionados cuando se pueda evitar,
- evitar operaciones destructivas sin confirmacion.

## 11. Reglas para n8n

- documentar triggers, inputs, outputs, errores, credenciales y trazabilidad,
- no cambiar workflows reales sin dejar documentacion alineada,
- preservar el uso de `correlation_id` en flujos trazables,
- guardar exports y documentos de workflow cuando aplique,
- no asumir credenciales de n8n no verificadas.

## 12. Reglas para Supabase

- documentar tablas, relaciones, constraints e indices,
- no hacer cambios destructivos sin confirmacion,
- mantener separados usos `anon` y `service_role`,
- revisar seguridad y, si aplica, RLS y permisos antes de cambios de datos,
- no inventar tablas o columnas no confirmadas.

## 13. Reglas para frontend

- no exponer secretos ni tokens administrativos en `VITE_*`,
- mantener UX funcional, tablas, formularios y estados claros,
- no modificar frontend salvo documentacion cuando la tarea lo pida expresamente,
- al documentar, distinguir entre estado detectado y previsto.

## 14. Reglas para backend

- centralizar logica de negocio en servicios y adaptadores,
- evitar lectura directa de variables de entorno desde capas dispersas cuando haya cliente o config dedicados,
- no modificar backend salvo documentacion cuando la tarea actual sea documental,
- documentar integraciones y contratos relevantes.

## 15. Reglas para documentacion

- `CONTEXT.md` es la fuente principal de contexto operativo,
- `AGENTS.md` define reglas de trabajo para Codex,
- `docs/PROJECT_STATUS.md` debe reflejar estado real,
- `docs/ROADMAP.md` debe ordenar fases y siguiente hito,
- si existe duplicidad documental, conservar y senalar para revision, no borrar automaticamente.

## 16. Sistema de agentes previsto

El sistema previsto usa:

- `CONTEXT.md`
- `AGENTS.md`
- 21 skills en `.codex/skills/`
- 12 playbooks en `.codex/playbooks/`
- documentacion base en `docs/`

El `orchestrator` coordina y selecciona subagentes; no debe activar todos por defecto.

## 17. Flujo ideal de trabajo

1. Leer `CONTEXT.md` y `AGENTS.md`.
2. Revisar `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md` si existen.
3. Diagnosticar el estado real del bloque a tocar.
4. Elegir skill o playbook adecuado.
5. Ejecutar cambios pequenos y verificables.
6. Actualizar documentacion afectada.
7. Ejecutar comprobaciones razonables.
8. Resumir resultados y siguiente paso.

## 18. Definicion de tarea terminada

Una tarea queda terminada cuando el objetivo esta resuelto o el bloqueo real esta claramente documentado, la documentacion relevante esta alineada y las comprobaciones disponibles para ese bloque se han ejecutado o se explica por que no se pudieron ejecutar.

## 19. Casos en los que Codex debe preguntar antes de actuar

- cambios destructivos,
- cambios en produccion,
- commit o push,
- decisiones arquitectonicas incompatibles sin criterio claro,
- uso de credenciales reales no disponibles,
- acciones externas reales como envios comerciales o despliegues.

## 20. Casos en los que Codex debe avanzar sin preguntar

- diagnostico del repo,
- reorganizacion documental segura,
- completado de Markdown ya existente,
- generacion de docs base faltantes,
- actualizacion de playbooks o skills sin tocar logica de producto,
- verificaciones de solo lectura.

## 21. Pendientes principales

- mantener sincronizados `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md`,
- alinear docs canonicamente entre nombres en espanol existentes y nuevos nombres operativos,
- revisar posibles duplicados documentales heredados,
- seguir probando el flujo real backend -> Supabase -> n8n con controlado impacto.

## 22. Siguiente paso recomendado

Usar `.codex/playbooks/documentation-update.md` para revisar documentos canonicos secundarios, detectar desalineaciones seguras y mantener la base operativa de agentes sincronizada sin modificar logica del producto.

## 23. Sistema de ejecucion basado en prompt.md

El sistema operativo del proyecto se basa en el archivo `prompt.md`, que define los bloques logicos de ejecucion.

Flujo real de trabajo:

AGENTS.md → prompt.md → playbooks → skills → ejecucion

Reglas:

- Codex debe usar `prompt.md` como punto de entrada para cualquier tarea
- No debe ejecutar tareas directamente sin mapearlas a un bloque de `prompt.md`
- Cada bloque en `prompt.md` define:
  - el playbook a usar
  - los agentes implicados
  - el objetivo
  - las restricciones
- Tras cada ejecucion, debe determinar el siguiente bloque logico

Si no existe un bloque adecuado en `prompt.md`:

1. Detectarlo
2. Proponer nuevo bloque
3. Generar el prompt correspondiente
4. No ejecutarlo sin validacion si implica riesgo

Este sistema permite ejecucion autonoma controlada sin perder coherencia ni seguridad.
