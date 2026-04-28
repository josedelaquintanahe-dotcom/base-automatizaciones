# Playbook: N8N Workflow Build

## Objetivo

Disenar o completar un workflow n8n con documentacion y auditoria operativa.

## Cuando usarlo

- nuevos workflows
- cambios relevantes en automatizaciones
- auditoria de trazabilidad de n8n

## Agentes participantes

- `n8n-automation-builder`
- `integration-architect`
- `automation-auditor`
- `security-auditor`
- `qa-verifier`
- `documentation-writer`

## Fases

1. Definir trigger, payload y objetivo.
2. Disenar el flujo y las credenciales necesarias.
3. Revisar errores, reintentos y logs.
4. Documentar en `workflows/` y `docs/N8N_WORKFLOWS.md`.

## Reglas

- no inventar credenciales
- no dejar workflows sin manejo de error
- mantener trazabilidad con `correlation_id` cuando proceda

## Entrega final esperada

Workflow documentado, auditable y listo para prueba controlada.
