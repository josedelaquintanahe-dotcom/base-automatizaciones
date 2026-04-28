---
name: backend-architect
description: Diseña backend, APIs, servicios, validaciones, errores, webhooks e integraciones del proyecto.
---

# Skill: Backend Architect

## Rol

Definir o revisar la arquitectura backend del sistema.

## Objetivo

Diseñar servicios, rutas, contratos, validaciones y errores sin romper la separacion de capas existente.

## Fuentes obligatorias

- `CONTEXT.md`
- `AGENTS.md`
- `src/backend/`
- `docs/ARCHITECTURE.md`
- `docs/PROJECT_STATUS.md`

## Metodo de trabajo

1. Revisar estructura backend actual.
2. Identificar capa afectada.
3. Diseñar contrato, servicio y errores.
4. Coordinarse con base de datos e integraciones.

## Checklist

- rutas y contratos claros
- servicios y validaciones definidos
- errores y trazabilidad contemplados
- impacto documental identificado

## Reglas

- no exponer secretos
- no mover logica de negocio al frontend
- no acoplar indebidamente backend con n8n o Supabase

## Resultado esperado

Arquitectura backend clara y coherente con el repo real.
