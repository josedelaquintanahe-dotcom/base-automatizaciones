import { workflow, node, trigger, ifElse, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook - onboarding_trace_verified',
    parameters: {
      httpMethod: 'POST',
      path: 'onboarding_trace_verified',
      responseMode: 'responseNode',
      options: {},
    },
    position: [240, 300],
  },
});

const validatePayload = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Validar payload',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const incoming = $input.first().json;
const payload = incoming.body ?? incoming;
const errors = [];

if (!payload.correlation_id) errors.push('correlation_id requerido');
if (!payload.cliente_id) errors.push('cliente_id requerido');
if (payload.event_name !== 'onboarding_activated') errors.push('event_name invalido');

return [
  {
    json: {
      valid: errors.length === 0,
      errors,
      payload,
      correlation_id: payload.correlation_id ?? null,
      cliente_id: payload.cliente_id ?? null
    }
  }
];
      `,
    },
    position: [520, 300],
  },
});

const loadAutomationEvents = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Get automation_events',
    parameters: {
      resource: 'row',
      operation: 'getAll',
      tableId: 'automation_events',
      returnAll: false,
      limit: 1,
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          {
            keyName: 'correlation_id',
            condition: 'eq',
            keyValue: '={{ $("Code - Validar payload").first().json.correlation_id }}',
          },
          {
            keyName: 'event_name',
            condition: 'eq',
            keyValue: 'onboarding_activated',
          },
        ],
      },
    },
    position: [816, 300],
  },
});

const buildVerificationContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Preparar verificacion',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const source = $('Code - Validar payload').first().json;
const rows = $input.all().map((item) => item.json);
const matchedRow = rows[0] ?? null;
const traceFound = Boolean(source.valid && matchedRow);

return [
  {
    json: {
      correlation_id: source.correlation_id,
      cliente_id: source.cliente_id,
      payload: source.payload,
      trace_found: traceFound,
      final_status: traceFound ? 'completed' : 'error',
      result_summary: traceFound
        ? 'Evento onboarding_activated localizado en automation_events'
        : 'No se encontro onboarding_activated en automation_events para el correlation_id recibido',
      next_action: traceFound
        ? 'Continuar con onboarding_readiness_revalidated'
        : 'Revisar backend, automation_events y reintentar la secuencia',
      sanitized_result: {
        matched_event_name: matchedRow?.event_name ?? null,
        dispatch_status: matchedRow?.dispatch_status ?? null
      }
    }
  }
];
      `,
    },
    position: [1112, 300],
  },
});

const insertExecution = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Insert execution received',
    parameters: {
      resource: 'row',
      operation: 'create',
      tableId: 'ejecuciones_workflows',
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          {
            fieldId: 'workflow_name',
            fieldValue: 'onboarding_trace_verified',
          },
          {
            fieldId: 'execution_source',
            fieldValue: 'n8n_webhook',
          },
          {
            fieldId: 'correlation_id',
            fieldValue: '={{ $json.correlation_id }}',
          },
          {
            fieldId: 'cliente_id',
            fieldValue: '={{ $json.cliente_id }}',
          },
          {
            fieldId: 'status',
            fieldValue: 'received',
          },
          {
            fieldId: 'input_payload',
            fieldValue: '={{ $json }}',
          },
          {
            fieldId: 'started_at',
            fieldValue: '={{ $now.toISO() }}',
          },
        ],
      },
    },
    position: [1408, 300],
  },
});

const buildUpdateContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Contexto update',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const execution = $input.first().json;
const verification = $('Code - Preparar verificacion').first().json;

return [
  {
    json: {
      workflow_execution_id: execution.id ?? null,
      correlation_id: verification.correlation_id,
      cliente_id: verification.cliente_id,
      final_status: verification.final_status,
      result_summary: verification.result_summary,
      next_action: verification.next_action,
      sanitized_result: verification.sanitized_result
    }
  }
];
      `,
    },
    position: [1704, 300],
  },
});

const checkEventFound = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Trace found',
    parameters: {
      conditions: {
        options: {
          caseSensitive: true,
          typeValidation: 'strict',
        },
        conditions: [
          {
            leftValue: '={{ $json.final_status === "completed" }}',
            operator: {
              type: 'boolean',
              operation: 'true',
            },
            rightValue: true,
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
    position: [1984, 300],
  },
});

const updateCompleted = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Update completed',
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'ejecuciones_workflows',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          {
            keyName: 'id',
            condition: 'eq',
            keyValue: '={{ $json.workflow_execution_id }}',
          },
          {
            keyName: 'correlation_id',
            condition: 'eq',
            keyValue: '={{ $json.correlation_id }}',
          },
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          {
            fieldId: 'status',
            fieldValue: 'completed',
          },
          {
            fieldId: 'input_payload',
            fieldValue: '={{ { result_summary: $json.result_summary, next_action: $json.next_action, sanitized_result: $json.sanitized_result } }}',
          },
          {
            fieldId: 'finished_at',
            fieldValue: '={{ $now.toISO() }}',
          },
        ],
      },
    },
    position: [2264, 192],
  },
});

const respondOk = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Webhook - OK',
    parameters: {
      respondWith: 'json',
      responseBody: '={{ ({ accepted: true, workflow_name: "onboarding_trace_verified", correlation_id: $("Code - Contexto update").first().json.correlation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
      options: {
        responseCode: 202,
      },
    },
    position: [2544, 192],
  },
});

const updateError = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Update error',
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'ejecuciones_workflows',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          {
            keyName: 'id',
            condition: 'eq',
            keyValue: '={{ $json.workflow_execution_id }}',
          },
          {
            keyName: 'correlation_id',
            condition: 'eq',
            keyValue: '={{ $json.correlation_id }}',
          },
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          {
            fieldId: 'status',
            fieldValue: 'error',
          },
          {
            fieldId: 'input_payload',
            fieldValue: '={{ { result_summary: $json.result_summary, next_action: $json.next_action, sanitized_result: $json.sanitized_result } }}',
          },
          {
            fieldId: 'finished_at',
            fieldValue: '={{ $now.toISO() }}',
          },
        ],
      },
    },
    position: [2264, 432],
  },
});

const respondError = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Webhook - Error',
    parameters: {
      respondWith: 'json',
      responseBody: '={{ ({ accepted: false, workflow_name: "onboarding_trace_verified", correlation_id: $("Code - Contexto update").first().json.correlation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
      options: {
        responseCode: 422,
      },
    },
    position: [2544, 432],
  },
});

export default workflow('onboarding-trace-verified-v1', 'onboarding_trace_verified')
  .add(webhookTrigger)
  .to(validatePayload)
  .to(loadAutomationEvents)
  .to(buildVerificationContext)
  .to(insertExecution)
  .to(buildUpdateContext)
  .to(
    checkEventFound
      .onTrue(updateCompleted.to(respondOk))
      .onFalse(updateError.to(respondError)),
  );
