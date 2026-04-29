import { workflow, node, trigger, ifElse, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook - onboarding_dispatch_health_checked',
    parameters: {
      httpMethod: 'POST',
      path: 'onboarding_dispatch_health_checked',
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
const snapshot = payload.system_status_snapshot ?? {};

if (!payload.correlation_id) errors.push('correlation_id requerido');
if (!payload.cliente_id) errors.push('cliente_id requerido');
if (payload.event_name !== 'onboarding_activated') errors.push('event_name invalido');
if (!snapshot.onboardingDispatch) errors.push('system_status_snapshot.onboardingDispatch requerido');

return [
  {
    json: {
      valid: errors.length === 0,
      errors,
      payload,
      correlation_id: payload.correlation_id ?? null,
      cliente_id: payload.cliente_id ?? null,
      system_status_snapshot: snapshot
    }
  }
];
      `,
    },
    position: [520, 300],
  },
});

const buildDispatchContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Preparar dispatch health',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const source = $input.first().json;
const snapshot = source.system_status_snapshot ?? {};
const dispatch = snapshot.onboardingDispatch ?? {};
const configured = dispatch.configured === true;
const pathStatus = dispatch.pathStatus ?? null;
const isConsistent = Boolean(source.valid && configured && pathStatus === 'expected');

return [
  {
    json: {
      correlation_id: source.correlation_id,
      cliente_id: source.cliente_id,
      payload: source.payload,
      final_status: isConsistent ? 'completed' : 'error',
      result_summary: isConsistent
        ? 'onboardingDispatch configurado y con path esperado'
        : 'onboardingDispatch no esta configurado correctamente para continuar la secuencia',
      next_action: isConsistent
        ? 'Continuar con onboarding_sanitized_report_compiled'
        : 'Revisar /api/system/status y la configuracion de dispatch de onboarding',
      sanitized_result: {
        configured,
        pathStatus
      }
    }
  }
];
      `,
    },
    position: [816, 300],
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
            fieldValue: 'onboarding_dispatch_health_checked',
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
    position: [1112, 300],
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
const verification = $('Code - Preparar dispatch health').first().json;

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
    position: [1408, 300],
  },
});

const checkDispatch = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Dispatch healthy',
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
    position: [1688, 300],
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
    position: [1968, 192],
  },
});

const respondOk = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Webhook - OK',
    parameters: {
      respondWith: 'json',
      responseBody: '={{ ({ accepted: true, workflow_name: "onboarding_dispatch_health_checked", correlation_id: $("Code - Contexto update").first().json.correlation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
      options: {
        responseCode: 202,
      },
    },
    position: [2248, 192],
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
    position: [1968, 432],
  },
});

const respondError = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Webhook - Error',
    parameters: {
      respondWith: 'json',
      responseBody: '={{ ({ accepted: false, workflow_name: "onboarding_dispatch_health_checked", correlation_id: $("Code - Contexto update").first().json.correlation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
      options: {
        responseCode: 422,
      },
    },
    position: [2248, 432],
  },
});

export default workflow('onboarding-dispatch-health-checked-v1', 'onboarding_dispatch_health_checked')
  .add(webhookTrigger)
  .to(validatePayload)
  .to(buildDispatchContext)
  .to(insertExecution)
  .to(buildUpdateContext)
  .to(
    checkDispatch
      .onTrue(updateCompleted.to(respondOk))
      .onFalse(updateError.to(respondError)),
  );
