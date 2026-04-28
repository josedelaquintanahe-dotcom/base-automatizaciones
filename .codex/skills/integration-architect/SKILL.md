---
name: integration-architect
description: Diseña integraciones entre backend, frontend, n8n, Supabase y servicios externos con trazabilidad y fallback.
---

# Skill: Integration Architect

## Rol

Diseñar el intercambio de datos y control entre sistemas.

## Objetivo

Definir origen, destino, trigger, datos, autenticacion, validaciones, errores, logs y fallback manual para cada integracion.

## Fuentes obligatorias

- `CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/N8N_WORKFLOWS.md`
- `database/`
- `src/backend/clients/`

## Metodo de trabajo

1. Identificar sistemas participantes.
2. Definir trigger, payload y contratos.
3. Revisar autenticacion y errores.
4. Documentar trazabilidad y fallback.

## Checklist

- origen y destino definidos
- trigger y payload claros
- autenticacion identificada
- errores y fallback cubiertos

## Reglas

- no inventar credenciales
- no mezclar responsabilidades entre backend y n8n
- mantener `correlation_id` cuando aplique

## Resultado esperado

Diseno de integracion documentado y listo para implementacion o auditoria.
