# Playbook: Build Feature

## Objetivo

Construir una funcionalidad nueva con control tecnico, QA y seguridad.

## Cuando usarlo

- nuevas features de frontend o backend
- cambios funcionales de producto

## Agentes participantes

- `feature-builder`
- `backend-architect` si aplica
- `frontend-engineer` si aplica
- `database-architect` si aplica
- `qa-verifier`
- `code-reviewer`
- `security-auditor`
- `fixer` si hace falta

## Fases

1. Leer contexto y contratos afectados.
2. Diseñar el bloque.
3. Implementar con cambios acotados.
4. Ejecutar lint, tests y build si aplican.
5. Corregir hallazgos y documentar.

## Reglas

- no ampliar alcance sin necesidad
- no tocar produccion
- no cerrar sin verificaciones razonables

## Entrega final esperada

Feature implementada, verificada y documentada.
