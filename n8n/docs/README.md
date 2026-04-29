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

## Workflow actual versionado

- `n8n/workflows/onboarding_activated.active.json`
  - origen: version activa del workflow cloud `onboarding_activated`
  - estado: sanitizado y alineado con la ruta real `/webhook/onboarding_activated`

## Flujo recomendado de mantenimiento

1. actualizar o verificar el workflow real en n8n,
2. revalidar el flujo con `scripts/run-onboarding-operational-check.ps1`,
3. refrescar la exportacion JSON sanitaria si el workflow cambio,
4. mantener alineados `docs/N8N_WORKFLOWS.md` y `workflows/onboarding__webhook__onboarding_activated__v1.md`.
