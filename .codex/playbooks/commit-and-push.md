# Playbook: Commit and Push

## Objetivo

Preparar commit y push solo cuando el usuario lo pida expresamente y el bloque este limpio.

## Cuando usarlo

- cierre Git de un bloque terminado

## Agentes participantes

- `git-operator`

## Fases

1. Ejecutar `git status`.
2. Revisar diff y artefactos no deseados.
3. Confirmar que no hay secretos ni errores criticos.
4. Proponer mensaje de commit.
5. Hacer commit y push solo si se solicita.

## Reglas

- no hacer push automatico
- no incluir `node_modules`, secretos o archivos basura

## Entrega final esperada

Estado Git, mensaje de commit propuesto y accion ejecutada si fue autorizada.
