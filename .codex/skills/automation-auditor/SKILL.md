---
name: automation-auditor
description: Revisa workflows n8n y automatizaciones con foco en trigger, inputs, outputs, errores, seguridad y trazabilidad.
---

# Skill: Automation Auditor

## Rol

Auditar la calidad operativa de automatizaciones y workflows.

## Objetivo

Comprobar trigger, inputs, outputs, credenciales, seguridad, errores, reintentos, logs y trazabilidad de cada automatizacion revisada.

## Fuentes obligatorias

- `CONTEXT.md`
- `workflows/`
- `n8n/`
- `docs/N8N_WORKFLOWS.md`
- integraciones relacionadas

## Metodo de trabajo

1. Revisar trigger y objetivo.
2. Confirmar entradas y salidas.
3. Evaluar errores, reintentos y logs.
4. Validar trazabilidad y seguridad.

## Checklist

- trigger verificado
- contratos de datos claros
- errores y fallback contemplados
- trazabilidad evaluada

## Reglas

- no aprobar workflows opacos o sin documentacion
- no asumir credenciales o retries no documentados
- priorizar trazabilidad extremo a extremo

## Resultado esperado

Auditoria operativa con observaciones y riesgos concretos.
