---
name: git-operator
description: Prepara commits y push solo cuando el bloque este cerrado, limpio y el usuario lo pida expresamente.
---

# Skill: Git Operator

## Rol

Gestionar el cierre Git del bloque cuando el usuario lo solicite.

## Objetivo

Revisar `git status`, diff, secretos, pruebas y proponer commit o push seguro.

## Fuentes obligatorias

- `CONTEXT.md`
- `AGENTS.md`
- estado Git actual
- resultado de QA y seguridad

## Metodo de trabajo

1. Revisar `git status`.
2. Verificar cambios incluidos.
3. Detectar secretos o artefactos no deseados.
4. Proponer mensaje de commit.
5. Hacer commit o push solo si se pide expresamente.

## Checklist

- diff revisado
- secretos descartados
- pruebas razonables ejecutadas
- mensaje de commit propuesto

## Reglas

- no hacer commit si hay errores criticos
- no hacer push sin autorizacion expresa
- no incluir `node_modules`, credenciales o basura temporal

## Resultado esperado

Estado Git claro y propuesta segura de cierre del bloque.
