# PROJECT_STATUS.md

## Estado general

Estado actual: operativo en base documental y tecnica, con frontend y backend funcionales, sistema de agentes de Codex estructurado y flujo real de onboarding validado extremo a extremo.

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
- flujo de onboarding con trazabilidad backend -> `automation_events` -> n8n -> `ejecuciones_workflows`, validado en entorno real el 28 de abril de 2026 y revalidado tras despliegue el 29 de abril de 2026
- smoke test operativo versionado en `scripts/verify-onboarding-flow.ps1`
- export JSON sanitario del workflow real en `n8n/workflows/onboarding_activated.active.json`
- secuencia de 5 workflows de auditoria post-onboarding definida y preparada documentalmente
- blueprint SDK validado para `onboarding_trace_verified` en `n8n/workflows/onboarding_trace_verified.workflow.ts`
- workflow `onboarding_trace_verified` publicado en n8n Cloud y validado en ejecucion real el 29 de abril de 2026
- entorno de frontend y backend con scripts de test
- `CONTEXT.md`, `AGENTS.md`, `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md` ya presentes como base operativa

## Riesgos y huecos detectados

- coexistencia de documentacion en espanol y nueva documentacion operativa en nombres canonicos
- posibles duplicados documentales a revisar manualmente
- carpeta historica `context_legacy/` tras la normalizacion del contexto principal
- coexistencia de configuracion versionada en `render.yaml` y configuracion manual en Render, con riesgo de deriva si no se sincronizan tras futuros cambios

## Estado por areas

### Frontend

- Estado: funcional
- Validado: estructura, tests, lint y build existentes
- Pendiente: evolucion funcional segun roadmap

### Backend

- Estado: funcional
- Validado: servicios, rutas, tests, adaptadores y resumen operativo `onboardingDispatch` expuesto en `/api/system/status`
- Pendiente: seguir reforzando integraciones y diagnostico

### Supabase

- Estado: integrado en backend
- Validado: cliente, configuracion, tablas documentadas
- Pendiente: validaciones adicionales de seguridad y RLS segun futuras ampliaciones

### n8n

- Estado: integrado por webhooks y documentacion
- Validado: workflow `onboarding_activated` documentado, ejecutable, exportado de forma sanitaria y confirmado en trazabilidad real con `ejecuciones_workflows`, incluida revalidacion post-despliegue; `onboarding_trace_verified` publicado, con respuesta HTTP alineada y validado en ejecucion real por `correlation_id`
- Pendiente: implementar `onboarding_readiness_revalidated` y mantener el resto de la secuencia auditiva como backlog inmediato

### Sistema de agentes Codex

- Estado: estructurado y documentado
- Validado: 21 skills y 12 playbooks localizados; `CONTEXT.md` y `AGENTS.md` canonicos presentes
- Pendiente: probarlo en uso real y mantenerlo sincronizado con la evolucion del repositorio

## Siguiente hito razonable

Implementar `onboarding_readiness_revalidated` reutilizando el mismo patron: blueprint validado, borrador en n8n, script operativo y validacion real por `correlation_id`.
