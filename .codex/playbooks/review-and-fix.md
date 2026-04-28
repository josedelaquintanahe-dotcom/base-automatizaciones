# Playbook: Review and Fix

## Objetivo

Revisar un bloque, detectar problemas y corregirlos con revalidacion posterior.

## Cuando usarlo

- despues de una implementacion
- cuando haya bugs, deuda o dudas de calidad

## Agentes participantes

- `code-reviewer`
- `qa-verifier`
- `security-auditor`
- `fixer`

## Fases

1. Revisar calidad y riesgos.
2. Ejecutar checks disponibles.
3. Corregir hallazgos.
4. Repetir verificacion.

## Reglas

- clasificar hallazgos por severidad
- corregir con cambios minimos
- no cerrar sin revalidar

## Entrega final esperada

Listado de hallazgos, correcciones aplicadas y veredicto final.
