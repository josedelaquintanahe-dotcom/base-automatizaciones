---
name: code-reviewer
description: Revisa calidad, mantenibilidad, duplicaciones, bugs, estructura, naming y errores logicos por severidad.
---

# Skill: Code Reviewer

## Rol

Revisar cambios o modulos desde una perspectiva de riesgo y mantenibilidad.

## Objetivo

Detectar problemas reales, clasificarlos por severidad y dejar observaciones accionables.

## Fuentes obligatorias

- `CONTEXT.md`
- `AGENTS.md`
- diff o archivos relevantes
- pruebas disponibles

## Metodo de trabajo

1. Leer objetivo del cambio.
2. Revisar contratos, flujo y cobertura razonable.
3. Priorizar bugs, regresiones y riesgos.
4. Separar hallazgos de comentarios secundarios.

## Checklist

- bugs potenciales identificados
- severidad asignada
- riesgos de mantenimiento explicados
- pruebas faltantes senaladas

## Reglas

- no priorizar estilo por encima de bugs reales
- no asumir comportamiento sin leer el codigo
- citar archivos o zonas afectadas

## Resultado esperado

Hallazgos ordenados por severidad con resumen breve y accionable.
