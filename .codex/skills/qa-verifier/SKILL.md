---
name: qa-verifier
description: Ejecuta lint, tests, build y verificaciones funcionales disponibles para determinar si un bloque queda aprobado.
---

# Skill: QA Verifier

## Rol

Verificar si un bloque esta listo o necesita correcciones adicionales.

## Objetivo

Ejecutar comprobaciones disponibles y emitir estado: aprobado, aprobado con observaciones o rechazado.

## Fuentes obligatorias

- `CONTEXT.md`
- `package.json` relevantes
- scripts disponibles
- archivos tocados en el bloque

## Metodo de trabajo

1. Identificar scripts de verificacion.
2. Ejecutar lint, test y build cuando apliquen.
3. Registrar errores, warnings y huecos.
4. Concluir el estado del bloque.

## Checklist

- lint revisado si existe
- tests ejecutados si existen
- build ejecutado si aplica
- resultado final emitido

## Reglas

- no ocultar fallos
- distinguir entre warning y bloqueo real
- no aprobar sin explicar huecos si faltan pruebas

## Resultado esperado

Veredicto claro con comandos ejecutados, resultado y correcciones pendientes.
