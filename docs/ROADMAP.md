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
- secuencia de 5 workflows de auditoria post-onboarding documentada, publicada y validada de forma automatica desde `onboarding_activated`

## Fase 3. Expansion de automatizaciones

Estado: cerrada para la base auditiva

Objetivos:

- ampliar workflows n8n mas alla de `onboarding_activated`,
- definir patrones de error, reintentos, logs y fallback manual,
- documentar credenciales, entradas y salidas por workflow.

Secuencia inmediata priorizada:

1. `onboarding_trace_verified` - publicado, validado y encadenado automaticamente
2. `onboarding_readiness_revalidated` - publicado, validado y encadenado automaticamente
3. `onboarding_credentials_metadata_checked` - publicado, validado y encadenado automaticamente
4. `onboarding_dispatch_health_checked` - publicado, validado y encadenado automaticamente
5. `onboarding_sanitized_report_compiled` - publicado, validado y encadenado automaticamente

## Fase 4. Consolidacion comercial y de despliegue

Estado: en progreso

Objetivos:

- fortalecer `docs/SALES_PLAYBOOK.md`,
- consolidar preparacion de despliegue en Render, Vercel, Supabase y n8n,
- dejar prompts reutilizables para siguientes bloques de trabajo.

Hecho recientemente:

- revalidacion remota de `automation_client_health_snapshot` completada el 30 de abril de 2026 contra backend desplegado, n8n y Supabase
- provisionado idempotente y ejecucion por `n8n_workflow_id` confirmados en entorno desplegado
- persistencia verificada en `ejecuciones` y `ejecuciones_workflows` con el mismo `correlation_id`
- `automation_client_next_actions_brief` definido, documentado, publicado en n8n Cloud y validado en prueba segura manual el 30 de abril de 2026
- `automation_client_next_actions_brief` validado extremo a extremo el 30 de abril de 2026 contra backend desplegado, n8n y Supabase
- `automation_client_first_run_handoff` definido, publicado en n8n Cloud y validado en prueba segura manual, desde backend local y desde backend desplegado el 30 de abril de 2026
- `automation_client_controlled_run_stage` definido en repo, publicado en n8n Cloud y validado extremo a extremo desde backend local con rollback operativo el 2 de mayo de 2026

## Prioridades actuales

1. Mantener documentacion operativa alineada con el repo.
2. Evitar deriva entre codigo, skills, playbooks y docs base.
3. Desplegar backend con `client_controlled_run_stage` y revalidar `automation_client_controlled_run_stage` contra Render.

## Dependencias

- `docs/PROJECT_STATUS.md` debe reflejar el estado real antes de planificar nuevos hitos.
- Los cambios funcionales importantes deben apoyarse en seguridad, QA y documentacion.
- El orquestador debe usar solo skills necesarias para cada bloque.

## Siguiente paso recomendado

Desplegar y revalidar `automation_client_controlled_run_stage` en Render, y despues usarlo como puente hacia la primera automatizacion objetivo con efecto operativo real controlado.
