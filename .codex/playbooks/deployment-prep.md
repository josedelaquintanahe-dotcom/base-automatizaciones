# Playbook: Deployment Prep

## Objetivo

Preparar el proyecto para despliegue sin asumir produccion ni ejecutar cambios irreversibles.

## Cuando usarlo

- antes de staging
- antes de release
- cuando se revisen variables o proveedores

## Agentes participantes

- `deployment-engineer`
- `qa-verifier`
- `security-auditor`
- `documentation-writer`
- `git-operator` si se pide cierre

## Fases

1. Revisar build y checks.
2. Confirmar `.env.example`.
3. Revisar docs de despliegue.
4. Evaluar riesgos por entorno.

## Reglas

- no desplegar produccion sin confirmacion
- no asumir pipelines no verificados

## Entrega final esperada

Checklist de despliegue y riesgos pendientes.
