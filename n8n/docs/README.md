# n8n

## Proposito

Conservar activos versionados de workflows reales y notas operativas de la instancia n8n sin depender solo de la UI cloud.

## Estructura

- `n8n/workflows/`: exportaciones JSON sanitarias de workflows activos o versionados
- `n8n/docs/`: notas operativas de versionado y uso

## Regla principal

El documento funcional principal sigue viviendo en `workflows/` y el indice canonico en `docs/N8N_WORKFLOWS.md`.

Las exportaciones JSON de `n8n/workflows/`:

- reflejan el estado tecnico real de la instancia,
- no sustituyen a la documentacion funcional,
- no deben incluir secretos reales ni credenciales exportadas.

## Activos versionados detectados

- `n8n/workflows/onboarding_activated.active.json`
  - origen: export JSON sanitario del workflow cloud `onboarding_activated`
  - estado: versionado y alineado con la ruta real `/webhook/onboarding_activated`
- `n8n/workflows/*.workflow.ts`
  - origen: blueprints tecnicos SDK de los workflows publicados o preparados en repositorio
  - estado: incluyen la cadena auditiva post-onboarding, las automatizaciones internas publicadas y el blueprint pendiente de publicar `automation_client_invoice_mark_paid`
- `n8n/workflows/*.planned.json`
  - origen: placeholders tecnicos de la secuencia auditiva
  - estado: conservados como apoyo tecnico, no como fuente funcional principal

## Flujo recomendado de mantenimiento

1. actualizar o verificar el workflow real en n8n,
2. revalidar el flujo con `scripts/run-onboarding-operational-check.ps1`,
3. refrescar la exportacion JSON sanitaria si el workflow cambio,
4. mantener alineados `docs/N8N_WORKFLOWS.md`, `workflows/*.md` y los blueprints de `n8n/workflows/`.
