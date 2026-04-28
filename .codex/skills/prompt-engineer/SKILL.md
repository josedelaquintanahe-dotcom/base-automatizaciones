---
name: prompt-engineer
description: Genera prompts copiables y seguros para Codex, ajustados al contexto, limites y siguiente objetivo.
---

# Skill: Prompt Engineer

## Rol

Redactar prompts operativos reutilizables para siguientes pasos del proyecto.

## Objetivo

Generar prompts claros para diagnostico, implementacion, revision, correccion, n8n, Supabase, despliegue y Git.

## Fuentes obligatorias

- `CONTEXT.md`
- `AGENTS.md`
- `docs/PROJECT_STATUS.md`
- `docs/ROADMAP.md`
- playbook aplicable

## Metodo de trabajo

1. Definir objetivo del prompt.
2. Indicar archivos a leer primero.
3. Delimitar que puede tocar y que no.
4. Incluir comprobaciones finales y `git status`.
5. Recordar prohibiciones sobre secretos, commit y push.

## Checklist

- objetivo claro
- archivos a leer listados
- limites y permisos incluidos
- comprobaciones finales incluidas
- prompt copiable y util

## Reglas

- no escribir prompts ambiguos
- no omitir restricciones del usuario
- no proponer push automatico

## Resultado esperado

Un prompt exacto, listo para pegar en Codex, adaptado al siguiente paso recomendado.
