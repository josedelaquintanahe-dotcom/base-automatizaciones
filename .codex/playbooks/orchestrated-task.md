# Playbook: Orchestrated Task

## Objetivo

Ejecutar una tarea compleja mediante `orchestrator` y solo los subagentes necesarios.

## Cuando usarlo

- tareas mixtas
- tareas con varias capas tecnicas
- tareas con documentacion, QA y seguridad involucradas

## Agentes participantes

- `orchestrator`
- subagentes elegidos segun el objetivo

## Fases

1. Leer `CONTEXT.md`, `AGENTS.md`, `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md` si existen.
2. Clasificar la tarea.
3. Elegir subagentes necesarios.
4. Consolidar resultados.
5. Verificar riesgos y comprobaciones finales.

## Reglas

- no activar todos los agentes por defecto
- priorizar seguridad, claridad y trazabilidad
- no recomendar push automatico

## Entrega final esperada

Resumen con objetivo, agentes usados, archivos tocados, verificaciones, riesgos y siguiente paso.
