# Playbook: Secure Release

## Objetivo

Preparar un cierre o release con control de calidad, seguridad y despliegue.

## Cuando usarlo

- antes de release
- antes de commit final importante
- antes de despliegue

## Agentes participantes

- `qa-verifier`
- `security-auditor`
- `code-reviewer`
- `deployment-engineer`
- `git-operator` si se pide cierre Git

## Fases

1. Ejecutar QA.
2. Revisar seguridad.
3. Revisar riesgos de release.
4. Confirmar documentacion y variables.

## Reglas

- no aprobar con riesgo critico abierto
- no desplegar ni hacer push sin confirmacion

## Entrega final esperada

Checklist de release, riesgos residuales y recomendacion de cierre.
