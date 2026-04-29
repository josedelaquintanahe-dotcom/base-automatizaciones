# N8N_WORKFLOWS.md

## Objetivo

Servir como indice base para workflows n8n y como plantilla documental para futuros flujos.

## Estado de vigencia

Este documento funciona como indice canonico resumido. El detalle operativo principal del workflow actual vive en `workflows/onboarding__webhook__onboarding_activated__v1.md`.

## Workflow detectado

### `onboarding_activated`

- documento fuente: `workflows/onboarding__webhook__onboarding_activated__v1.md`
- export JSON sanitario: `n8n/workflows/onboarding_activated.active.json`
- estado detectado: documentado en repositorio, creado en n8n Cloud y validado extremo a extremo el 28 de abril de 2026
- trigger: webhook `POST`
- objetivo: registrar trazabilidad tecnica de onboarding activado
- persistencia esperada: `automation_events` y `ejecuciones_workflows`
- ruta activa validada: `/webhook/onboarding_activated`

## Siguiente secuencia planificada

Workflows de bajo riesgo preparados documentalmente para la siguiente fase:

1. `onboarding_trace_verified`
2. `onboarding_readiness_revalidated`
3. `onboarding_credentials_metadata_checked`
4. `onboarding_dispatch_health_checked`
5. `onboarding_sanitized_report_compiled`

Documentacion base:

- `n8n/docs/onboarding_audit_sequence.md`
- `workflows/onboarding__audit__*.md`
- `n8n/workflows/*.planned.json`
- `n8n/workflows/onboarding_trace_verified.workflow.ts`
- `n8n/workflows/onboarding_readiness_revalidated.workflow.ts`
- `n8n/workflows/onboarding_credentials_metadata_checked.workflow.ts`

### Estado actual de la secuencia auditiva

#### `onboarding_trace_verified`

- documento fuente: `workflows/onboarding__audit__onboarding_trace_verified__v1.md`
- blueprint tecnico: `n8n/workflows/onboarding_trace_verified.workflow.ts`
- placeholder tecnico: `n8n/workflows/onboarding_trace_verified.planned.json`
- workflowId en n8n Cloud: `yqr1wDX4aDS9JyH5`
- estado detectado: blueprint SDK validado, workflow publicado en n8n Cloud y validado en ejecucion real el 29 de abril de 2026
- trigger canonico: webhook `POST` interno/controlado
- ruta activa: `/webhook/onboarding_trace_verified`
- objetivo: confirmar que `onboarding_activated` quedo persistido en `automation_events` con el mismo `correlation_id`
- persistencia esperada: `ejecuciones_workflows` con resultado sanitario dentro de `input_payload`
- script operativo previsto para validacion real: `scripts/verify-onboarding-trace-workflow.ps1`

#### `onboarding_readiness_revalidated`

- documento fuente: `workflows/onboarding__audit__onboarding_readiness_revalidated__v1.md`
- blueprint tecnico: `n8n/workflows/onboarding_readiness_revalidated.workflow.ts`
- placeholder tecnico: `n8n/workflows/onboarding_readiness_revalidated.planned.json`
- workflowId en n8n Cloud: `NxCOMdciTp8QkDtb`
- estado detectado: blueprint SDK validado, workflow publicado en n8n Cloud y validado en ejecucion real el 29 de abril de 2026
- trigger canonico: webhook `POST` interno/controlado
- ruta activa: `/webhook/onboarding_readiness_revalidated`
- objetivo: revalidar las condiciones sanitarias de readiness usando el payload persistido del evento `onboarding_activated`
- persistencia esperada: `ejecuciones_workflows` con resultado sanitario dentro de `input_payload`
- script operativo previsto para validacion real: `scripts/verify-onboarding-readiness-workflow.ps1`

#### `onboarding_credentials_metadata_checked`

- documento fuente: `workflows/onboarding__audit__onboarding_credentials_metadata_checked__v1.md`
- blueprint tecnico: `n8n/workflows/onboarding_credentials_metadata_checked.workflow.ts`
- placeholder tecnico: `n8n/workflows/onboarding_credentials_metadata_checked.planned.json`
- workflowId en n8n Cloud: `GWjTrTPILaIRQ6ZO`
- estado detectado: blueprint SDK validado, workflow publicado en n8n Cloud y validado en ejecucion real el 29 de abril de 2026
- trigger canonico: webhook `POST` interno/controlado
- ruta activa: `/webhook/onboarding_credentials_metadata_checked`
- objetivo: verificar metadatos sanitarios de credenciales y token usando `automation_events.payload.operational_summary`
- persistencia esperada: `ejecuciones_workflows` con resultado sanitario dentro de `input_payload`
- script operativo previsto para validacion real: `scripts/verify-onboarding-credentials-workflow.ps1`

## Controles operativos minimos

- mantener alineados `render.yaml`, Render y la ruta activa del workflow real,
- tratar `ONBOARDING_DISPATCH_WEBHOOK_URL` como la referencia exacta del workflow versionado o activo,
- usar `N8N_WEBHOOK_BASE_URL` solo como base generica, no como sustituto del webhook especifico de onboarding,
- repetir una prueba real con `correlation_id` verificable despues de cualquier cambio de webhook, credencial o entorno n8n,
- usar `scripts/verify-onboarding-flow.ps1` como smoke test versionado cuando la validacion requiera activar onboarding real desde backend,
- comprobar siempre:
  - fila en `automation_events`,
  - fila en `ejecuciones_workflows`,
  - mismo `correlation_id`,
  - `workflow_status = completed` salvo error controlado.

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
- tratar `n8n/workflows/*.json` como exportaciones tecnicas sanitarias, no como fuente funcional principal,
- mantener alineado workflow real y documento fuente.

## Estado de versionado actual

- export JSON sanitario versionado para `onboarding_activated`
- placeholders tecnicos versionados para la secuencia de auditoria post-onboarding

## Pendiente de validar

- catalogo ampliado de workflows futuros
- estrategia estable para versionar workflows reales entre repositorio y n8n Cloud
