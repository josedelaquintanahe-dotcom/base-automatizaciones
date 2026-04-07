# Base de Automatizaciones Empresariales

Repositorio base para construir sistemas profesionales de automatizacion empresarial sobre Windows con una arquitectura reutilizable y documentada.

## Objetivo

Este proyecto establece una estructura comun para futuros desarrollos que integren:

- Supabase como backend, autenticacion y base de datos PostgreSQL.
- n8n como motor de workflows y orquestacion.
- Rendel.com como plataforma de agentes automatizados.
- Vercel como capa de despliegue serverless y frontend.
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
- `agents/`: definicion y documentacion de agentes de Rendel.com.
- `deployment/`: procedimientos de despliegue y operacion en Vercel.
- `integrations/`: conectores con APIs y servicios externos.
- `config/`: variables de entorno, configuracion base y referencias operativas.
- `docs/`: documentacion de arquitectura, roadmap y decisiones.
- `scripts/`: scripts auxiliares para automatizacion local o mantenimiento.
- `src/`: codigo fuente de servicios, utilidades o frontend cuando aplique.
- `tests/`: pruebas automatizadas y validaciones del sistema.

## Documentacion inicial

- `docs/arquitectura.md`: vision tecnica del sistema y relacion entre componentes.
- `docs/plan.md`: roadmap tecnico inicial.
- `docs/decisiones.md`: registro de decisiones estructurales y tecnicas.

## Variables de entorno

El repositorio incluye `.env.example` con variables de referencia para:

- Supabase
- n8n
- Rendel.com
- Vercel

No deben anadirse claves reales, tokens ni credenciales sensibles.

## Flujo de mantenimiento

1. Registrar cambios estructurales en `docs/decisiones.md`.
2. Mantener la documentacion del modulo correspondiente actualizada.
3. Versionar scripts, configuraciones y convenciones sin exponer secretos.
4. Preservar compatibilidad con Windows en rutas, comandos y automatizaciones.

## Estado inicial

Esta base deja preparada la estructura documental y modular para empezar a implementar:

- esquemas de Supabase,
- workflows n8n,
- agentes en Rendel.com,
- despliegues en Vercel,
- integraciones empresariales futuras.
