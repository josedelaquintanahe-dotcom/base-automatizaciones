# Base de Automatizaciones Empresariales

Repositorio base para construir sistemas profesionales de automatizacion empresarial sobre Windows con una arquitectura reutilizable y documentada.

## Objetivo

Este proyecto establece una estructura comun para futuros desarrollos que integren:

- Supabase como backend, autenticacion y base de datos PostgreSQL.
- n8n como motor de workflows y orquestacion.
- Rendel.com como posible plataforma de agentes externos, `Pendiente de validar` en este repositorio.
- Vercel como opcion documentada para frontend o serverless, `Pendiente de validar` como flujo operativo actual.
- Codex como agente de mantenimiento estructural y documental del repositorio.

## Principios de diseno

- Reutilizacion: la estructura debe servir como plantilla para nuevos proyectos.
- Modularidad: cada dominio operativo vive en su propia carpeta.
- Trazabilidad: las decisiones arquitectonicas se registran en `docs/decisiones.md`.
- Seguridad: no se almacenan credenciales reales en el repositorio.
- Compatibilidad Windows: nombres, rutas y documentacion pensados para ejecucion y mantenimiento en Windows.

## Estructura principal

- `database/`: diseno de datos, esquemas y convenciones de Supabase.
- `workflows/`: documentacion y versionado logico de workflows de n8n.
- `agents/`: referencia para una futura capa de agentes externos.
- `deployment/`: procedimientos y guias de despliegue para Render, Vercel y operacion relacionada.
- `integrations/`: conectores con APIs y servicios externos.
- `config/`: variables de entorno, configuracion base y referencias operativas.
- `docs/`: documentacion de arquitectura, roadmap y decisiones.
- `scripts/`: scripts auxiliares para automatizacion local o mantenimiento.
- `src/`: codigo fuente de servicios, utilidades o frontend cuando aplique.
- `tests/`: pruebas automatizadas y validaciones del sistema.

## Documentacion principal

- `CONTEXT.md`: contexto operativo principal del proyecto
- `AGENTS.md`: reglas de trabajo para Codex
- `docs/README.md`: mapa de la documentacion del repositorio
- `docs/PROJECT_STATUS.md`: estado real resumido
- `docs/ROADMAP.md`: roadmap operativo actual
- `docs/decisiones.md`: registro de decisiones estructurales y tecnicas

## Orden de lectura recomendado para agentes

Un agente nuevo debe empezar en este orden:

1. `CONTEXT.md`
2. `AGENTS.md`
3. `docs/PROJECT_STATUS.md`
4. `docs/ROADMAP.md`
5. `docs/README.md`
6. documentacion especifica del bloque que vaya a revisar o modificar

## Variables de entorno

El repositorio incluye `.env.example` con variables de referencia para:

- Supabase
- n8n
- Rendel.com si se confirma su uso
- Vercel si se confirma ese flujo de despliegue

No deben anadirse claves reales, tokens ni credenciales sensibles.

## Comandos de verificacion

Los paquetes siguen separados en `src/backend` y `src/frontend`. Comandos recomendados desde la raiz:

- backend lint: `npm --prefix src/backend run lint`
- backend test: `npm --prefix src/backend test`
- frontend lint: `npm --prefix src/frontend run lint`
- frontend test: `npm --prefix src/frontend test`
- frontend build: `npm --prefix src/frontend run build`

## Flujo de mantenimiento

1. Registrar cambios estructurales en `docs/decisiones.md`.
2. Mantener la documentacion del modulo correspondiente actualizada.
3. Versionar scripts, configuraciones y convenciones sin exponer secretos.
4. Preservar compatibilidad con Windows en rutas, comandos y automatizaciones.

## Sistema de agentes Codex

El sistema operativo de agentes de Codex para este repositorio se apoya en:

- `CONTEXT.md` como contexto principal del proyecto
- `AGENTS.md` como reglas operativas
- `.codex/skills/` para skills especializadas
- `.codex/playbooks/` para flujos reutilizables

Playbooks recomendados para empezar sin tocar logica del producto:

- `.codex/playbooks/documentation-update.md` para alinear documentacion
- `.codex/playbooks/project-diagnosis-and-next-prompt.md` para rediagnosticar el repo y generar el siguiente prompt operativo

## Estado actual

La base ya dispone de:

- backend Node.js + Express funcional,
- frontend React + Vite funcional,
- integracion real con Supabase en backend,
- workflow inicial de n8n documentado y trazable,
- sistema documental de agentes Codex ya estructurado.
