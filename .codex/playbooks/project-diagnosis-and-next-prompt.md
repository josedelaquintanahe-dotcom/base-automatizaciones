# Playbook: Project Diagnosis and Next Prompt

## Objetivo

Diagnosticar el estado real del proyecto y producir el siguiente prompt operativo para Codex sin modificar logica del producto.

## Cuando usarlo

- inicio de bloque nuevo
- despues de cambios grandes
- cuando haga falta claridad sobre siguiente paso

## Agentes participantes

- `project-state-auditor`
- `roadmap-planner`
- `prompt-engineer`
- `orchestrator`

## Fases

1. Auditar estructura, stack, scripts, docs, frontend, backend, Supabase, n8n y sistema de agentes.
2. Crear o actualizar `docs/PROJECT_STATUS.md`.
3. Crear o actualizar `docs/ROADMAP.md`.
4. Generar el siguiente prompt copiables para Codex.
5. Consolidar riesgos y siguiente hito.

## Reglas

- no inventar estado tecnico
- no tocar logica del producto
- terminar con `git status`

## Entrega final esperada

- `docs/PROJECT_STATUS.md` actualizado
- `docs/ROADMAP.md` actualizado
- resumen del estado del proyecto
- siguiente prompt recomendado para Codex
