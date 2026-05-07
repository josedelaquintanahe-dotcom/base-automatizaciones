# PROJECT_STATUS.md

## Estado general

Estado actual: operativo en base documental y tecnica, con frontend y backend funcionales, sistema de agentes de Codex estructurado y flujo real de onboarding validado extremo a extremo.

## Lo detectado en el repositorio

- frontend React + Vite en `src/frontend`
- backend Node.js + Express en `src/backend`
- tests y lint disponibles por paquete
- integracion real con Supabase en backend
- workflow `onboarding_activated` documentado en `workflows/`
- workflow `automation_client_health_snapshot` definido en repo y publicado en n8n Cloud
- carpeta `n8n/` activa como espacio tecnico versionado para blueprints, exports sanitarios y placeholders de workflows
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
- workflow `onboarding_readiness_revalidated` publicado en n8n Cloud y validado en ejecucion real el 29 de abril de 2026
- workflow `onboarding_credentials_metadata_checked` publicado en n8n Cloud y validado en ejecucion real el 29 de abril de 2026
- workflow `onboarding_dispatch_health_checked` publicado en n8n Cloud y validado en ejecucion real el 29 de abril de 2026
- workflow `onboarding_sanitized_report_compiled` publicado en n8n Cloud y validado en ejecucion real el 29 de abril de 2026
- secuencia auditiva completa ejecutada en real con un solo `correlation_id` el 29 de abril de 2026
- `onboarding_activated` actualizado para encadenar automaticamente los 5 workflows auditivos y validado en ejecucion real el 29 de abril de 2026 con `all_checks_passed = true`
- backend ajustado para persistir `automation_events` antes del webhook n8n y actualizar despues el estado de entrega cuando sea necesario
- backend preparado para provisionar y ejecutar una automatizacion base real por `n8n_workflow_id` usando payload sanitario
- workflow `automation_client_health_snapshot` publicado en n8n Cloud y validado en prueba segura manual el 30 de abril de 2026
- workflow `automation_client_health_snapshot` validado extremo a extremo contra el backend desplegado, n8n y Supabase el 30 de abril de 2026
- workflow `automation_client_next_actions_brief` publicado en n8n Cloud y validado en prueba segura manual el 30 de abril de 2026
- workflow `automation_client_next_actions_brief` validado extremo a extremo contra el backend desplegado, n8n y Supabase el 30 de abril de 2026
- workflow `automation_client_first_run_handoff` publicado en n8n Cloud y validado en prueba segura manual el 30 de abril de 2026
- workflow `automation_client_first_run_handoff` validado extremo a extremo desde backend local con servicios reales el 30 de abril de 2026
- workflow `automation_client_first_run_handoff` validado extremo a extremo contra el backend desplegado, n8n y Supabase el 30 de abril de 2026
- `automation_client_controlled_run_stage` publicado en n8n Cloud y validado extremo a extremo desde backend local y desde backend desplegado el 2 de mayo de 2026, incluyendo rollback operativo por el mismo workflow
- `automation_client_invoice_draft_create` publicado en n8n Cloud y validado extremo a extremo desde backend local y desde backend desplegado con efecto real reversible sobre `facturas` el 4 de mayo de 2026
- `automation_client_controlled_run_stage` revalidado el 4 de mayo de 2026 como puente operativo hacia `automation_client_invoice_draft_create`, tanto en backend local como en backend desplegado, incluyendo programacion reversible de `proxima_ejecucion` sobre la automatizacion objetivo
- blueprint tecnico, documento fuente del workflow, template backend provisionable, test unitario del template y script operativo de `automation_client_invoice_mark_paid` preparados en repositorio el 4 de mayo de 2026 como siguiente automatizacion objetivo para completar el siguiente paso del ciclo minimo de facturacion
- preparacion documental de despliegue del bloque `automation_client_invoice_mark_paid` revisada el 4 de mayo de 2026, incluyendo checklist por paquete, variables de frontend y validacion operativa con rollback documentadas en `docs/DEPLOYMENT.md`
- revision del bloque documental y operativo de `automation_client_invoice_mark_paid` completada el 5 de mayo de 2026 para exigir que el rollback deje un `correlation_id` tecnico distinto en la validacion versionada
- QA local del bloque `automation_client_invoice_mark_paid` ejecutada el 5 de mayo de 2026 con `npm --prefix src/backend run lint`, `npm --prefix src/backend test -- --runInBand` y parseo sintactico de `scripts/verify-client-invoice-mark-paid-automation.ps1`, sin fallos detectados en backend ni en el script operativo
- blueprint `automation_client_invoice_mark_paid` revisado localmente el 7 de mayo de 2026 para impedir falsos `completed` cuando una actualizacion concurrente en `facturas` no llegue a mutar ninguna fila en Supabase
- workflow `automation_client_invoice_mark_paid` publicado en n8n Cloud el 7 de mayo de 2026 (`ibchfEswxI6RiSGt`) y validado extremo a extremo contra backend desplegado con mutacion real reversible sobre `facturas`, `correlation_id` distinto para rollback y trazabilidad confirmada en `ejecuciones` y `ejecuciones_workflows`
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
- Validado: workflow `onboarding_activated` documentado, ejecutable, exportado de forma sanitaria y confirmado en trazabilidad real con `ejecuciones_workflows`, incluida revalidacion post-despliegue; los 5 workflows de auditoria post-onboarding estan publicados, encadenados automaticamente y validados en ejecucion real por `correlation_id`, incluida la secuencia completa; `automation_client_health_snapshot`, `automation_client_next_actions_brief`, `automation_client_first_run_handoff` y `automation_client_controlled_run_stage` estan publicados en n8n Cloud y validados en ejecucion real extremo a extremo desde el backend desplegado; `automation_client_controlled_run_stage` ademas valida rollback operativo por el mismo workflow; `automation_client_invoice_draft_create` esta publicado en n8n Cloud y validado en ejecucion real local y desplegada con rollback operativo sobre `facturas`; el puente desde `automation_client_controlled_run_stage` hacia `automation_client_invoice_draft_create` ha quedado validado tanto en local como en backend desplegado; `automation_client_invoice_mark_paid` ya esta publicado en n8n Cloud y validado en ejecucion real desplegada con efecto reversible sobre una factura `pendiente`, rollback con `correlation_id` distinto y trazabilidad completa en backend y `ejecuciones_workflows`
- Pendiente: definir la siguiente automatizacion objetivo que avance el ciclo de negocio despues de `automation_client_invoice_mark_paid`

### Sistema de agentes Codex

- Estado: estructurado y documentado
- Validado: 21 skills y 12 playbooks localizados; `CONTEXT.md` y `AGENTS.md` canonicos presentes
- Pendiente: probarlo en uso real y mantenerlo sincronizado con la evolucion del repositorio

## Siguiente hito razonable

Definir la siguiente automatizacion objetivo con efecto operativo controlado despues del ciclo minimo `invoice_draft_create -> invoice_mark_paid`, reutilizando el mismo patron de mutacion reversible y trazabilidad por `correlation_id`.
