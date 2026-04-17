# Workflow `onboarding__webhook__onboarding_activated__v1`

## Objetivo

Registrar en Supabase la recepcion y resultado de la primera accion real disparada por `onboarding_activated`, reutilizando `correlation_id` extremo a extremo.

## Trigger

- tipo: `webhook`
- origen: backend dispatcher de onboarding
- evento esperado: `onboarding_activated`

## Entrada esperada

Payload minimo esperado desde backend:

```json
{
  "event_name": "onboarding_activated",
  "version": "v1",
  "correlation_id": "uuid-o-correlation-id",
  "cliente_id": "uuid-cliente",
  "timestamp": "2026-04-17T10:00:00.000Z",
  "source": "backoffice_activation",
  "onboarding_status": "listo_para_automatizar",
  "activation_date": "2026-04-17",
  "client_summary": {
    "id": "uuid-cliente",
    "nombre_empresa": "Empresa Test",
    "email_contacto": "ops@test.com",
    "plan": "profesional",
    "estado": "activo",
    "fecha_inicio": "2026-04-17"
  },
  "automation_readiness": {
    "ready": true,
    "missing_requirements": [],
    "next_recommended_action": "Onboarding activado. Pendiente de conectar el dispatcher real."
  },
  "operational_summary": {
    "credenciales_activas": 2,
    "tipos_credencial": ["gmail", "api"],
    "token_operativo_activo": true,
    "factura_inicial_emitida": true
  }
}
```

## Tablas afectadas en Supabase

- `ejecuciones_workflows`

## Flujo exacto recomendado en n8n

1. `Webhook`
   - recibe `POST`
   - payload JSON

2. `IF` o `Code` para validacion basica
   - comprobar:
     - `event_name === "onboarding_activated"`
     - `version === "v1"`
     - `correlation_id` no vacio
     - `cliente_id` no vacio
   - si falla:
     - responder `400`
     - no continuar

3. `Supabase Insert` en `ejecuciones_workflows`
   - valores:
     - `workflow_name = "onboarding__webhook__onboarding_activated__v1"`
     - `execution_source = "n8n_webhook"`
     - `correlation_id = {{$json.correlation_id}}`
     - `cliente_id = {{$json.cliente_id}}`
     - `status = "received"`
     - `input_payload = {{$json}}`
     - `started_at = {{$now}}`
   - guardar `id` insertado para el update final

4. `Set` o `Code` para resultado de negocio minimo
   - construir un resumen simple:
     - `status = "completed"`
     - `result_summary = "Workflow recibido y registrado en Supabase"`

5. `Supabase Update` sobre `ejecuciones_workflows`
   - localizar por `id` devuelto por el insert
   - actualizar:
     - `status = "completed"`
     - `finished_at = {{$now}}`

6. Rama de error
   - si cualquier nodo despues del insert falla:
     - `Supabase Update`
       - `status = "error"`
       - `finished_at = {{$now}}`
   - mantener `correlation_id`

7. `Respond to Webhook`
   - devolver `200` o `202`
   - body sugerido:

```json
{
  "accepted": true,
  "workflow_name": "onboarding__webhook__onboarding_activated__v1",
  "correlation_id": "{{$json.correlation_id}}"
}
```

## Estados

- `received`: payload valido recibido y fila creada
- `completed`: workflow registrado correctamente
- `error`: el workflow se recibio pero fallo despues del insert inicial

## Verificacion extrema a extrema

1. Activar onboarding desde backoffice.
2. Confirmar fila en `automation_events`.
3. Confirmar fila en `ejecuciones_workflows`.
4. Verificar mismo `correlation_id` en ambas tablas.
5. Verificar `status = "completed"` o `status = "error"` segun resultado real.

## Siguiente paso natural

Una vez validado este workflow, la siguiente accion real puede ser anadir un segundo nodo de negocio de bajo riesgo, por ejemplo registrar una tarea operativa interna o crear una alerta controlada.
