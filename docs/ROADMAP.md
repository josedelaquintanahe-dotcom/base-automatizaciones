# ROADMAP.md

## Objetivo del roadmap

Ordenar el trabajo del proyecto por fases realistas, separando estado detectado, consolidacion documental y siguientes hitos tecnicos.

## Fase 1. Consolidacion operativa del repositorio

Estado: muy avanzada

Objetivos:

- consolidar `CONTEXT.md` y `AGENTS.md`,
- normalizar skills y playbooks de `.codex/`,
- mantener `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md` alineados,
- dejar reglas claras para diagnostico, QA, seguridad y Git.

Pendiente residual:

- validar el sistema de agentes en uso real sobre mas bloques documentales,
- revisar duplicidades entre documentacion historica en espanol y documentos canonicos nuevos.

## Fase 2. Estabilizacion funcional de la base actual

Estado: avanzada

Objetivos:

- mantener backend y frontend con lint, test y build reproducibles,
- mantener validada la trazabilidad completa de onboarding,
- reforzar documentacion tecnica de arquitectura, seguridad y despliegue.

Hecho recientemente:

- validacion real de `backend -> automation_events -> n8n -> ejecuciones_workflows`
- correccion del webhook de onboarding en Render para usar la ruta activa `onboarding_activated`
- exposicion del resumen seguro `onboardingDispatch` en `/api/system/status`
- revalidacion completa del flujo tras despliegue el 29 de abril de 2026
- versionado de `scripts/verify-onboarding-flow.ps1` para revalidacion operativa repetible
- export JSON sanitario del workflow activo en `n8n/workflows/`
- secuencia de 5 workflows de auditoria post-onboarding documentada y preparada

## Fase 3. Expansion de automatizaciones

Estado: preparada documentalmente

Objetivos:

- ampliar workflows n8n mas alla de `onboarding_activated`,
- definir patrones de error, reintentos, logs y fallback manual,
- documentar credenciales, entradas y salidas por workflow.

Secuencia inmediata priorizada:

1. `onboarding_trace_verified` - publicado y validado en ejecucion real
2. `onboarding_readiness_revalidated` - siguiente bloque inmediato
3. `onboarding_credentials_metadata_checked`
4. `onboarding_dispatch_health_checked`
5. `onboarding_sanitized_report_compiled`

## Fase 4. Consolidacion comercial y de despliegue

Estado: pendiente

Objetivos:

- fortalecer `docs/SALES_PLAYBOOK.md`,
- consolidar preparacion de despliegue en Render, Vercel, Supabase y n8n,
- dejar prompts reutilizables para siguientes bloques de trabajo.

## Prioridades actuales

1. Mantener documentacion operativa alineada con el repo.
2. Evitar deriva entre codigo, skills, playbooks y docs base.
3. Endurecer la operacion real de onboarding y ampliar automatizaciones sobre una base ya validada.

## Dependencias

- `docs/PROJECT_STATUS.md` debe reflejar el estado real antes de planificar nuevos hitos.
- Los cambios funcionales importantes deben apoyarse en seguridad, QA y documentacion.
- El orquestador debe usar solo skills necesarias para cada bloque.

## Siguiente paso recomendado

Implementar `onboarding_readiness_revalidated`, validarlo con el mismo `correlation_id` y mantener la secuencia restante como backlog inmediato.
