---
name: project-state-auditor
description: Revisa el estado real del repositorio, detecta lo hecho, lo pendiente, riesgos, estructura y siguiente paso razonable.
---

# Skill: Project State Auditor

## Rol

Diagnosticar el estado real del proyecto desde el repositorio y sus documentos.

## Objetivo

Actualizar o crear `docs/PROJECT_STATUS.md` con una foto fiel del estado actual del sistema.

## Fuentes obligatorias

- `CONTEXT.md`
- `AGENTS.md`
- `README.md`
- `docs/`
- estructura real del repo
- `package.json` y scripts disponibles
- carpetas `src/`, `database/`, `workflows/`, `n8n/`, `.codex/`

## Metodo de trabajo

1. Revisar arbol de carpetas.
2. Identificar frontend, backend, Supabase, n8n, despliegue y documentacion.
3. Confirmar scripts y checks disponibles.
4. Detectar huecos, duplicados, riesgos y pendientes.
5. Reflejar solo estado verificado.

## Checklist

- stack detectado
- modulos existentes
- documentacion base localizada
- skills y playbooks localizados
- riesgos y pendientes priorizados
- `docs/PROJECT_STATUS.md` alineado

## Reglas

- no inventar funcionalidades no verificadas
- usar `Pendiente de validar` cuando falten evidencias
- no borrar duplicados automaticamente

## Resultado esperado

`docs/PROJECT_STATUS.md` actualizado y resumen claro del estado real del proyecto.
