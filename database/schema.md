# Esquema base de Supabase

## Proposito

Este archivo define una plantilla base para la futura integracion con Supabase. Su objetivo es ofrecer una estructura inicial reutilizable para proyectos de automatizacion empresarial sin depender todavia de un dominio de negocio concreto.

La propuesta se centra en trazabilidad, auditoria y control operativo.

## Principios de modelado

- Supabase actua como fuente de verdad del sistema.
- La estructura se disena para auditoria, trazabilidad y diagnostico.
- Las tablas de negocio futuras deben poder relacionarse con estos registros tecnicos sin romper el modelo base.
- No se incluyen credenciales, secretos ni valores reales en esta documentacion.

## Convencion de nombres recomendada

Para esta base se recomienda usar nombres de tablas en espanol, orientados a trazabilidad y mantenimiento. Si en una implementacion futura se opta por nombres en ingles, debe mantenerse una equivalencia documentada.

## Tablas tecnicas base requeridas

### 1. `logs_eventos`

Proposito:
Registrar eventos de entrada o internos que disparan acciones dentro del sistema.

Campos sugeridos:

- `id` UUID primary key
- `event_type` text
- `event_source` text
- `event_name` text
- `correlation_id` text nullable
- `payload` jsonb
- `status` text
- `received_at` timestamptz
- `processed_at` timestamptz nullable
- `created_at` timestamptz
- `updated_at` timestamptz

Notas:

- `correlation_id` permite enlazar el evento con workflows, agentes, auditoria y logs tecnicos.
- `payload` debe guardar el contenido original o una version normalizada del evento.

### 2. `ejecuciones_workflows`

Proposito:
Registrar cada ejecucion de workflow lanzada desde n8n o por integraciones relacionadas.

Campos sugeridos:

- `id` UUID primary key
- `workflow_name` text
- `workflow_version` text nullable
- `execution_source` text
- `n8n_execution_id` text nullable
- `event_id` UUID nullable
- `correlation_id` text nullable
- `status` text
- `input_payload` jsonb nullable
- `output_payload` jsonb nullable
- `error_summary` text nullable
- `started_at` timestamptz
- `finished_at` timestamptz nullable
- `duration_ms` integer nullable
- `created_at` timestamptz
- `updated_at` timestamptz

Relaciones sugeridas:

- `event_id` -> `logs_eventos.id`

Implementacion minima adoptada para el primer workflow real:

- `workflow_name`
- `execution_source`
- `correlation_id`
- `cliente_id`
- `status`
- `input_payload`
- `started_at`
- `finished_at`
- `created_at`

Estados iniciales recomendados:

- `received`
- `completed`
- `error`

### 3. `ejecuciones_agentes`

Proposito:
Registrar cada ejecucion de agente en Rendel.com o en cualquier sistema de agentes compatible.

Campos sugeridos:

- `id` UUID primary key
- `agent_name` text
- `agent_version` text nullable
- `agent_role` text nullable
- `provider_name` text
- `provider_execution_id` text nullable
- `workflow_execution_id` UUID nullable
- `event_id` UUID nullable
- `correlation_id` text nullable
- `status` text
- `input_context` jsonb nullable
- `output_result` jsonb nullable
- `error_summary` text nullable
- `started_at` timestamptz
- `finished_at` timestamptz nullable
- `duration_ms` integer nullable
- `created_at` timestamptz
- `updated_at` timestamptz

Relaciones sugeridas:

- `workflow_execution_id` -> `ejecuciones_workflows.id`
- `event_id` -> `logs_eventos.id`

### 4. `auditoria_integraciones`

Proposito:
Registrar trazabilidad de integraciones con Supabase, n8n, Rendel.com, Vercel u otros servicios externos futuros.

Campos sugeridos:

- `id` UUID primary key
- `integration_name` text
- `integration_type` text
- `direction` text
- `correlation_id` text nullable
- `request_reference` text nullable
- `request_payload` jsonb nullable
- `response_payload` jsonb nullable
- `status_code` integer nullable
- `status` text
- `error_summary` text nullable
- `executed_at` timestamptz
- `created_at` timestamptz

Notas:

- esta tabla debe ayudar a reconstruir intercambio tecnico sin almacenar secretos,
- `direction` puede normalizarse como `outbound` o `inbound`.

### 5. `configuraciones`

Proposito:
Documentar claves funcionales, flags o parametros de operacion que no sean secretos y que necesiten trazabilidad o control por entorno.

Campos sugeridos:

- `id` UUID primary key
- `config_key` text unique
- `config_scope` text
- `environment` text
- `value_json` jsonb nullable
- `is_active` boolean
- `description` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz

Notas:

- esta tabla no debe almacenar secretos ni credenciales,
- puede servir para feature flags, limites operativos o configuracion compartida no sensible.

### 6. `logs_tecnicos`

Proposito:
Centralizar logs tecnicos relevantes del sistema para depuracion, soporte y analisis operativo.

Campos sugeridos:

- `id` UUID primary key
- `log_level` text
- `log_source` text
- `message` text
- `details` jsonb nullable
- `event_id` UUID nullable
- `workflow_execution_id` UUID nullable
- `agent_execution_id` UUID nullable
- `correlation_id` text nullable
- `logged_at` timestamptz
- `created_at` timestamptz

Relaciones sugeridas:

- `event_id` -> `logs_eventos.id`
- `workflow_execution_id` -> `ejecuciones_workflows.id`
- `agent_execution_id` -> `ejecuciones_agentes.id`

### 7. `automation_events`

Proposito:
Persistir cada evento de automatizacion emitido por el backend o por dispatchers internos, con trazabilidad suficiente para auditoria operativa.

Campos sugeridos:

- `id` UUID primary key
- `event_name` text
- `cliente_id` UUID nullable
- `correlation_id` text nullable
- `event_timestamp` timestamptz
- `dispatch_mode` text
- `dispatch_status` text
- `destination` text nullable
- `error_message` text nullable
- `payload` jsonb
- `created_at` timestamptz

Notas:

- esta tabla sirve como historico tecnico y funcional del envio de eventos,
- debe permitir eventos futuros mas alla de `onboarding_activated`,
- `payload` debe guardar el evento estructurado ya normalizado, no secretos ni credenciales.

## Relaciones base del modelo

- un evento puede disparar cero o muchas ejecuciones de workflow,
- una ejecucion de workflow puede disparar cero o muchas ejecuciones de agente,
- una integracion puede quedar auditada independientemente del workflow o agente que la invoque,
- un evento, workflow o agente puede generar muchos logs tecnicos,
- `correlation_id` debe servir como identificador transversal para reconstruir el flujo completo.

Vista conceptual:

`logs_eventos` -> `ejecuciones_workflows` -> `ejecuciones_agentes`

`auditoria_integraciones` y `logs_tecnicos` se relacionan con cualquiera de las capas anteriores.

## Campos transversales recomendados

- `id`
- `correlation_id`
- `status`
- `created_at`
- `updated_at`
- `started_at`
- `finished_at`
- `duration_ms`

## Indices sugeridos

- `logs_eventos.event_type`
- `logs_eventos.correlation_id`
- `ejecuciones_workflows.workflow_name`
- `ejecuciones_workflows.n8n_execution_id`
- `ejecuciones_workflows.correlation_id`
- `ejecuciones_agentes.agent_name`
- `ejecuciones_agentes.provider_execution_id`
- `ejecuciones_agentes.correlation_id`
- `auditoria_integraciones.integration_name`
- `auditoria_integraciones.correlation_id`
- `configuraciones.config_key`
- `logs_tecnicos.log_level`
- `logs_tecnicos.log_source`
- `logs_tecnicos.correlation_id`
- campos de fecha usados en consultas operativas

## Politicas y acceso

- restringir escritura a servicios backend y procesos autorizados,
- limitar lectura de logs tecnicos segun rol operativo,
- evitar exponer payloads internos completos al frontend sin filtrado,
- aplicar RLS cuando existan usuarios finales o separacion por tenant.

## Estado actual

Plantilla base definida y lista para extenderse cuando se concrete el primer caso de uso funcional del sistema.
