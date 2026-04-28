# ARCHITECTURE.md

## Proposito

Este documento separa la arquitectura detectada en el repositorio de la arquitectura prevista a medio plazo.

## Arquitectura detectada

### Capas principales

- frontend en `src/frontend`
- backend en `src/backend`
- persistencia y contratos de datos en `database/`
- workflows y catalogo operativo en `workflows/`
- carpeta `n8n/` presente para documentacion y exports organizados de automatizaciones
- despliegue y operacion documentados en `deployment/`
- documentacion transversal en `docs/`
- sistema de agentes y playbooks en `.codex/`

### Backend detectado

- Express como capa HTTP
- capas separadas en `routes`, `controllers`, `services`, `repositories`, `clients`, `middlewares`, `config` y `utils`
- integracion real con Supabase
- adaptador de n8n por webhooks
- arranque en `src/backend/app/server.js`

### Frontend detectado

- React + Vite
- `react-router-dom` para navegacion
- paginas para dashboard, clientes, detalle, automatizaciones, facturacion, settings y not found
- cliente HTTP en `src/frontend/src/utils/api.js`

### Datos detectados

- tablas documentadas para `clientes`, `credenciales_cliente`, `tokens`, `facturas`, `automatizaciones`, `ejecuciones`, `automation_events` y `ejecuciones_workflows`

### Despliegue detectado

- `render.yaml` versionado para el backend con `rootDir: src/backend`
- no hay manifiesto de despliegue versionado para frontend mas alla de documentacion y variables

## Arquitectura prevista

### Aplicacion

- backend como centro de logica de negocio e integraciones
- frontend como capa de operacion y backoffice
- n8n como orquestador de workflows
- Supabase como persistencia principal

### Sistema de agentes Codex

- `CONTEXT.md` como contexto principal
- `AGENTS.md` como reglas operativas
- `.codex/skills/` para capacidades especializadas
- `.codex/playbooks/` para secuencias estandar de trabajo

## Reglas arquitectonicas

- no mover logica critica a n8n si debe vivir en backend,
- no usar frontend para secretos o privilegios amplios,
- no hacer cambios destructivos de base de datos sin confirmacion,
- no asumir despliegue de frontend o CI/CD no versionado como si estuviera confirmado,
- documentar arquitectura detectada frente a la prevista cuando haya huecos.

## Pendiente de validar

- topologia exacta de despliegue productivo activa en todos los entornos
- cobertura real de RLS y permisos avanzados en Supabase
