# AGENTS.md

## Proposito

Este archivo define como debe trabajar Codex dentro de `base-automatizaciones` para mantener un sistema coherente de documentacion, agentes, skills y playbooks sin alterar la logica funcional del producto salvo peticion expresa.

## Lectura obligatoria antes de tareas importantes

Antes de una tarea de analisis, implementacion, revision, seguridad, despliegue o coordinacion de agentes, Codex debe revisar en este orden:

1. `CONTEXT.md`
2. `AGENTS.md`
3. `docs/PROJECT_STATUS.md` si existe
4. `docs/ROADMAP.md` si existe
5. Documentacion o archivos concretos relacionados con la tarea

## Reglas generales de trabajo

- Responder en espanol salvo instruccion explicita en otro idioma.
- Priorizar cambios pequenos, reversibles y faciles de auditar.
- No borrar archivos utiles ni recrear documentacion desde cero si ya existe contenido aprovechable.
- Mantener compatibilidad con Windows en rutas, comandos, ejemplos y flujos operativos.
- Tratar `docs/` y `.codex/` como fuentes operativas del proyecto, no como anexos decorativos.
- Si una tarea afecta arquitectura, seguridad, despliegue, integraciones o sistema de agentes, reflejarlo en `docs/decisiones.md`.

## Reglas de seguridad

- No exponer secretos, tokens ni credenciales reales en archivos versionados.
- No modificar `.env` con valores reales salvo peticion expresa del usuario.
- No asumir permisos de produccion ni activar cambios irreversibles sin confirmacion.
- No documentar como validado algo que no se haya verificado de verdad.
- Si se detecta riesgo critico de seguridad, detener el cierre del bloque y reportarlo.

## Reglas de Git

- No hacer `commit`, `push`, `reset --hard`, `checkout --` ni operaciones destructivas salvo instruccion expresa.
- Antes de recomendar commit, revisar `git status`, diff, riesgos de secretos y estado de pruebas.
- No mezclar cambios no relacionados en un mismo bloque si es posible separarlos.
- Mantener el historial preparado para mensajes de commit claros del tipo `feat`, `fix`, `docs`, `security`, `refactor`, `test` o `chore`.

## Reglas de documentacion

- Actualizar documentacion relevante cuando cambie el contexto operativo del proyecto.
- Mantener sincronizados `CONTEXT.md`, `AGENTS.md`, `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md`.
- Marcar como `Pendiente de validar` cualquier dato no confirmado desde el repositorio o desde una comprobacion real.
- No borrar documentacion previa util; si hay duplicidad, dejarla senalada para revision.

## Sistema de skills y playbooks

- Las skills viven en `.codex/skills/<skill>/SKILL.md`.
- Los playbooks viven en `.codex/playbooks/`.
- Codex debe apoyarse en estas piezas como sistema operativo de trabajo para diagnostico, planificacion, implementacion, revision, seguridad y cierre.
- El orquestador no debe activar todos los subagentes por defecto; debe seleccionar solo los necesarios.

## Definicion de tarea terminada

Una tarea se considera terminada cuando:

1. El objetivo pedido esta resuelto o el bloqueo real esta claramente documentado.
2. Los archivos relevantes han sido actualizados sin romper restricciones del usuario.
3. Se han ejecutado las comprobaciones razonables disponibles para el riesgo del cambio.
4. La documentacion necesaria ha quedado alineada.
5. El resumen final incluye archivos tocados, comprobaciones hechas, riesgos y siguiente paso recomendado.

## Convencion de commits

Formato recomendado cuando el usuario pida commit:

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `security: ...`
- `refactor: ...`
- `test: ...`
- `chore: ...`

## Prohibiciones explicitas

- No hacer push automaticamente salvo peticion expresa.
- No modificar produccion sin confirmacion.
- No tocar frontend, backend o workflows productivos cuando la tarea sea solo documental.
- No inventar clientes, credenciales, integraciones o estados tecnicos no verificados.

## Cierre esperado de cada bloque

El resumen final debe indicar:

- que se hizo,
- que archivos se tocaron,
- que comprobaciones se ejecutaron,
- que riesgos o pendientes quedan,
- si conviene o no preparar commit,
- y cual es el siguiente paso operativo.
