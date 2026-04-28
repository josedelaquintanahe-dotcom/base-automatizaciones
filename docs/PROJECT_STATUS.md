# PROJECT_STATUS.md

## Estado general

Estado actual: operativo en base documental y tecnica, con frontend y backend funcionales y sistema de agentes de Codex ya estructurado y en fase de validacion operativa.

## Lo detectado en el repositorio

- frontend React + Vite en `src/frontend`
- backend Node.js + Express en `src/backend`
- tests y lint disponibles por paquete
- integracion real con Supabase en backend
- workflow `onboarding_activated` documentado en `workflows/`
- carpeta `n8n/` presente para organizacion documental futura
- 21 skills y 12 playbooks en `.codex/`

## Lo que ya esta hecho

- base arquitectonica documentada
- decisiones tecnicas registradas
- modelo SQL documentado para Supabase
- flujo de onboarding con trazabilidad backend -> `automation_events` -> n8n -> `ejecuciones_workflows`
- entorno de frontend y backend con scripts de test
- `CONTEXT.md`, `AGENTS.md`, `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md` ya presentes como base operativa

## Riesgos y huecos detectados

- coexistencia de documentacion en espanol y nueva documentacion operativa en nombres canonicos
- posibles duplicados documentales a revisar manualmente
- carpeta historica `context_legacy/` tras la normalizacion del contexto principal
- prueba real extremo a extremo sujeta a credenciales, entorno y tablas disponibles

## Estado por areas

### Frontend

- Estado: funcional
- Validado: estructura, tests, lint y build existentes
- Pendiente: evolucion funcional segun roadmap

### Backend

- Estado: funcional
- Validado: servicios, rutas, tests y adaptadores
- Pendiente: seguir reforzando integraciones y diagnostico

### Supabase

- Estado: integrado en backend
- Validado: cliente, configuracion, tablas documentadas
- Pendiente: validaciones adicionales de seguridad y RLS segun futuras ampliaciones

### n8n

- Estado: integrado por webhooks y documentacion
- Validado: workflow `onboarding_activated` documentado y trazable
- Pendiente: ampliar catalogo de workflows y auditoria operativa

### Sistema de agentes Codex

- Estado: estructurado y documentado
- Validado: 21 skills y 12 playbooks localizados; `CONTEXT.md` y `AGENTS.md` canonicos presentes
- Pendiente: probarlo en uso real y mantenerlo sincronizado con la evolucion del repositorio

## Siguiente hito razonable

Ejecutar una revision documental transversal final y, si no aparecen contradicciones nuevas, preparar el siguiente bloque seguro sobre validacion operativa o revision de cambios acumulados sin tocar logica del proyecto.
