# Workflow `onboarding__webhook__onboarding_activated__v1`

## Objetivo

Registrar en Supabase la recepcion y finalizacion tecnica del workflow logico `onboarding_activated`, reutilizando `correlation_id` extremo a extremo.

Este bloque no requiere modificar backend, dispatcher, frontend, payload del webhook ni `automation_events`.

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

No se modifica `automation_events`; solo se vincula por el valor compartido de `correlation_id`.

## Flujo exacto recomendado en n8n

1. `Webhook`
   - metodo: `POST`
   - path sugerido: `onboarding_activated`
   - response mode recomendado: `Using Respond to Webhook node`
   - payload: JSON actual enviado por el dispatcher, sin cambios

2. `IF` o `Code` para validacion basica
   - comprobar:
     - `event_name === "onboarding_activated"`
     - `version === "v1"`
     - `correlation_id` no vacio
     - `cliente_id` no vacio
   - si falla:
     - responder `400`
     - no continuar

   Ejemplo de salida valida desde un nodo `Code`:

```javascript
const payload = $json.body ?? $json;

if (
  payload.event_name !== "onboarding_activated" ||
  payload.version !== "v1" ||
  !payload.correlation_id ||
  !payload.cliente_id
) {
  throw new Error("Payload onboarding_activated invalido");
}

return [
  {
    json: {
      payload,
      correlation_id: payload.correlation_id,
      cliente_id: payload.cliente_id
    }
  }
];
```

3. `Supabase Insert` en `ejecuciones_workflows`
   - valores:
     - `workflow_name = "onboarding_activated"`
     - `execution_source = "n8n_webhook"`
     - `correlation_id = {{$json.correlation_id}}`
     - `cliente_id = {{$json.cliente_id}}`
     - `status = "received"`
     - `input_payload = {{$json.payload}}`
     - `started_at = {{$now}}`
   - devolver al menos `id`, `correlation_id` y `status`
   - guardar `id` insertado para el update final

4. `Set` o `Code` para conservar contexto de ejecucion
   - mantener:
     - `workflow_execution_id = id` devuelto por Supabase
     - `correlation_id`
     - `cliente_id`
     - `payload`
   - preparar resultado tecnico:
     - `status = "completed"`
     - `finished_at = {{$now}}`

5. `Supabase Update` sobre `ejecuciones_workflows`
   - localizar por `id` devuelto por el insert
   - actualizar:
     - `status = "completed"`
     - `finished_at = {{$now}}`
   - no actualizar por `correlation_id` si se dispone de `id`; `correlation_id` sirve para trazabilidad transversal, pero `id` evita ambiguedad si en el futuro hay mas de una fila tecnica por el mismo evento

6. Rama de error
   - si falla la validacion antes del insert:
     - responder `400`
     - no crear fila
   - si cualquier nodo despues del insert falla:
     - ejecutar `Supabase Update` sobre el mismo `id`
     - actualizar:
       - `status = "error"`
       - `finished_at = {{$now}}`
   - mantener `correlation_id` en la respuesta y en cualquier nodo de diagnostico

7. `Respond to Webhook`
   - devolver `200` o `202`
   - body sugerido:

```json
{
  "accepted": true,
  "workflow_name": "onboarding_activated",
  "correlation_id": "{{$json.correlation_id}}"
}
```

## Mapeo exacto de campos

| Campo `ejecuciones_workflows` | Valor en n8n |
| --- | --- |
| `workflow_name` | `"onboarding_activated"` |
| `execution_source` | `"n8n_webhook"` |
| `correlation_id` | `payload.correlation_id` |
| `cliente_id` | `payload.cliente_id` |
| `status` inicial | `"received"` |
| `input_payload` | payload completo recibido |
| `started_at` | timestamp actual de n8n |
| `finished_at` | `null` en insert; timestamp actual en update final |

## SQL minimo para Supabase produccion

El SQL minimo esta en `database/ejecuciones_workflows.sql`. Es idempotente, usa `CREATE TABLE IF NOT EXISTS`, crea solo indices propios de `ejecuciones_workflows` y no altera otras tablas.

La columna `id` no forma parte del payload, pero es necesaria como clave tecnica para actualizar de forma precisa la fila creada al inicio del workflow.

## Reutilizacion de `correlation_id`

El `correlation_id` entra desde el payload actual del webhook y se copia sin transformaciones a `ejecuciones_workflows.correlation_id`.

Dentro del workflow, el update final debe hacerse por `id` de la fila creada por el insert y validarse tambien con el mismo `correlation_id`. Asi se evita actualizar otra fila si en el futuro existe mas de una ejecucion tecnica relacionada.

Filtro recomendado para el update:

- `id eq {{$json.workflow_execution_id}}`
- `correlation_id eq {{$json.correlation_id}}`

El `correlation_id` se mantiene en paralelo para:

- responder al webhook con el mismo identificador,
- consultar trazabilidad cruzada con `automation_events`,
- diagnosticar el flujo completo sin depender del identificador interno de n8n.

## Blueprint n8n Cloud paso a paso

Nombres recomendados de nodos:

1. `Webhook - onboarding_activated`
   - Node: `Webhook`
   - HTTP Method: `POST`
   - Path: `onboarding_activated`
   - Response Mode: `Using Respond to Webhook node`

2. `Code - Validar payload`
   - Mode: `Run Once for All Items`
   - Codigo:

```javascript
const payload = $input.first().json.body ?? $input.first().json;

if (
  payload.event_name !== "onboarding_activated" ||
  payload.version !== "v1" ||
  !payload.correlation_id ||
  !payload.cliente_id
) {
  throw new Error("Payload onboarding_activated invalido");
}

return [
  {
    json: {
      payload,
      correlation_id: payload.correlation_id,
      cliente_id: payload.cliente_id
    }
  }
];
```

3. `Supabase - Insert ejecucion received`
   - Node: `Supabase`
   - Resource: `Row`
   - Operation: `Create`
   - Table: `ejecuciones_workflows`
   - Data to Send: `Define Below`
   - Fields:
     - `workflow_name`: `onboarding_activated`
     - `execution_source`: `n8n_webhook`
     - `correlation_id`: `={{ $json.correlation_id }}`
     - `cliente_id`: `={{ $json.cliente_id }}`
     - `status`: `received`
     - `input_payload`: `={{ $json.payload }}`
     - `started_at`: `={{ $now.toISO() }}`

4. `Edit Fields - Contexto update`
   - Node: `Edit Fields (Set)`
   - Include Other Input Fields: activado si se quiere conservar la respuesta completa del insert.
   - Fields:
     - `workflow_execution_id`: `={{ $json.id }}`
     - `correlation_id`: `={{ $("Code - Validar payload").first().json.correlation_id }}`
     - `cliente_id`: `={{ $("Code - Validar payload").first().json.cliente_id }}`
     - `payload`: `={{ $("Code - Validar payload").first().json.payload }}`
     - `final_status`: `completed`

5. `Supabase - Update ejecucion completed`
   - Node: `Supabase`
   - Resource: `Row`
   - Operation: `Update`
   - Table: `ejecuciones_workflows`
   - Match Type: `All Filters`
   - Filters:
     - `id` `eq` `={{ $json.workflow_execution_id }}`
     - `correlation_id` `eq` `={{ $json.correlation_id }}`
   - Fields:
     - `status`: `completed`
     - `finished_at`: `={{ $now.toISO() }}`

6. `Respond to Webhook - OK`
   - Node: `Respond to Webhook`
   - Respond With: `JSON`
   - Response Code: `202`
   - Body:

```json
{
  "accepted": true,
  "workflow_name": "onboarding_activated",
  "correlation_id": "={{ $('Code - Validar payload').first().json.correlation_id }}"
}
```

Rama de error recomendada:

- Para errores antes del insert, responder `400` desde una rama controlada de validacion.
- Para errores despues del insert, conectar una rama de error o workflow de error que reciba `workflow_execution_id` y `correlation_id`, y ejecute `Supabase - Update ejecucion error` con:
  - filtros: `id eq workflow_execution_id` y `correlation_id eq correlation_id`,
  - campos: `status = error`, `finished_at = {{$now.toISO()}}`.

Si el nodo `Supabase - Insert ejecucion received` no expone `id` en la salida visual de tu version de n8n Cloud, anade inmediatamente despues un `Supabase Get Many` filtrado por `workflow_name = onboarding_activated`, `correlation_id = {{$json.correlation_id}}` y `status = received`, ordenado por `created_at DESC` con limite `1`, y usa ese `id` para los updates.

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

Consulta de verificacion recomendada en Supabase:

```sql
SELECT
  ae.id AS automation_event_id,
  ae.event_name,
  ae.correlation_id,
  ae.dispatch_status,
  ew.id AS workflow_execution_id,
  ew.workflow_name,
  ew.execution_source,
  ew.status AS workflow_status,
  ew.started_at,
  ew.finished_at
FROM public.automation_events ae
LEFT JOIN public.ejecuciones_workflows ew
  ON ew.correlation_id = ae.correlation_id
WHERE ae.event_name = 'onboarding_activated'
ORDER BY ae.created_at DESC
LIMIT 20;
```

Resultado esperado:

- una fila reciente en `automation_events` con `event_name = 'onboarding_activated'`,
- una fila vinculada en `ejecuciones_workflows` con `workflow_name = 'onboarding_activated'`,
- el mismo `correlation_id` en ambas tablas,
- `workflow_status = 'completed'` si el flujo termino correctamente o `workflow_status = 'error'` si fallo despues del insert inicial.

## Siguiente paso natural

Una vez validado este workflow, la siguiente accion real puede ser anadir un segundo nodo de negocio de bajo riesgo, por ejemplo registrar una tarea operativa interna o crear una alerta controlada.
