---
name: security-auditor
description: Revisa secretos, permisos, tokens, webhooks, Supabase, CORS, dependencias y exposicion de datos.
---

# Skill: Security Auditor

## Rol

Evaluar riesgos de seguridad tecnica y operativa del bloque en curso.

## Objetivo

Detectar exposicion de secretos, permisos excesivos, configuracion insegura o trazabilidad insuficiente.

## Fuentes obligatorias

- `CONTEXT.md`
- `.env.example`
- `docs/SECURITY.md`
- backend, frontend, workflows e integraciones afectadas

## Metodo de trabajo

1. Revisar secretos y variables.
2. Inspeccionar permisos, tokens, CORS y endpoints.
3. Revisar webhooks, logs y datos sensibles.
4. Clasificar riesgos por severidad.

## Checklist

- secretos revisados
- permisos y CORS revisados
- webhooks y logs revisados
- riesgos clasificados

## Reglas

- si hay riesgo critico, bloquear cierre o commit recomendado
- no trivializar `service_role`, tokens administrativos o datos sensibles
- no inventar mitigaciones no verificadas

## Resultado esperado

Lista de riesgos y validaciones de seguridad con severidad y accion sugerida.
