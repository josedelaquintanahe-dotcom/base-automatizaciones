import { workflow, node, trigger, ifElse, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook - onboarding_activated',
    parameters: {
      httpMethod: 'POST',
      path: 'onboarding_activated',
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

if (payload.event_name !== 'onboarding_activated') errors.push('event_name invalido');
if (payload.version !== 'v1') errors.push('version invalida');
if (!payload.correlation_id) errors.push('correlation_id requerido');
if (!payload.cliente_id) errors.push('cliente_id requerido');

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

const isPayloadValid = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Payload valido',
    parameters: {
      conditions: {
        options: {
          caseSensitive: true,
          typeValidation: 'strict',
        },
        conditions: [
          {
            leftValue: '={{ $json.valid }}',
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
    position: [800, 300],
  },
});

const insertExecution = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Insert ejecucion received',
    parameters: {
      resource: 'row',
      operation: 'create',
      tableId: 'ejecuciones_workflows',
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'workflow_name', fieldValue: 'onboarding_activated' },
          { fieldId: 'execution_source', fieldValue: 'n8n_webhook' },
          { fieldId: 'correlation_id', fieldValue: '={{ $json.correlation_id }}' },
          { fieldId: 'cliente_id', fieldValue: '={{ $json.cliente_id }}' },
          { fieldId: 'status', fieldValue: 'received' },
          { fieldId: 'input_payload', fieldValue: '={{ $json.payload }}' },
          { fieldId: 'started_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [1104, 192],
  },
});

const buildExecutionContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Preparar contexto ejecucion',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const execution = $input.first().json;
const payloadContext = $('Code - Validar payload').first().json;

return [
  {
    json: {
      workflow_execution_id: execution.id ?? null,
      correlation_id: payloadContext.correlation_id,
      cliente_id: payloadContext.cliente_id,
      payload: payloadContext.payload
    }
  }
];
      `,
    },
    position: [1392, 192],
  },
});

const loadSystemStatus = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP - Get system status',
    parameters: {
      method: 'GET',
      url: 'https://base-automatizaciones.onrender.com/api/system/status',
      authentication: 'none',
      options: {
        response: {
          response: {
            fullResponse: true,
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
    position: [1680, 192],
  },
});

const callTraceWorkflow = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP - Call onboarding_trace_verified',
    parameters: {
      method: 'POST',
      url: 'https://quinttanaaa.app.n8n.cloud/webhook/onboarding_trace_verified',
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody:
        '={{ JSON.stringify({ correlation_id: $("Code - Preparar contexto ejecucion").first().json.correlation_id, cliente_id: $("Code - Preparar contexto ejecucion").first().json.cliente_id, event_name: "onboarding_activated" }) }}',
      options: {
        response: {
          response: {
            fullResponse: true,
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
    position: [1968, 192],
  },
});

const callReadinessWorkflow = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP - Call onboarding_readiness_revalidated',
    parameters: {
      method: 'POST',
      url: 'https://quinttanaaa.app.n8n.cloud/webhook/onboarding_readiness_revalidated',
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody:
        '={{ JSON.stringify({ correlation_id: $("Code - Preparar contexto ejecucion").first().json.correlation_id, cliente_id: $("Code - Preparar contexto ejecucion").first().json.cliente_id, event_name: "onboarding_activated" }) }}',
      options: {
        response: {
          response: {
            fullResponse: true,
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
    position: [2256, 192],
  },
});

const callCredentialsWorkflow = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP - Call onboarding_credentials_metadata_checked',
    parameters: {
      method: 'POST',
      url: 'https://quinttanaaa.app.n8n.cloud/webhook/onboarding_credentials_metadata_checked',
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody:
        '={{ JSON.stringify({ correlation_id: $("Code - Preparar contexto ejecucion").first().json.correlation_id, cliente_id: $("Code - Preparar contexto ejecucion").first().json.cliente_id, event_name: "onboarding_activated" }) }}',
      options: {
        response: {
          response: {
            fullResponse: true,
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
    position: [2544, 192],
  },
});

const callDispatchWorkflow = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP - Call onboarding_dispatch_health_checked',
    parameters: {
      method: 'POST',
      url: 'https://quinttanaaa.app.n8n.cloud/webhook/onboarding_dispatch_health_checked',
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody:
        '={{ JSON.stringify({ correlation_id: $("Code - Preparar contexto ejecucion").first().json.correlation_id, cliente_id: $("Code - Preparar contexto ejecucion").first().json.cliente_id, event_name: "onboarding_activated", system_status_snapshot: ($("HTTP - Get system status").first().json.body ?? $("HTTP - Get system status").first().json) }) }}',
      options: {
        response: {
          response: {
            fullResponse: true,
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
    position: [2832, 192],
  },
});

const callReportWorkflow = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP - Call onboarding_sanitized_report_compiled',
    parameters: {
      method: 'POST',
      url: 'https://quinttanaaa.app.n8n.cloud/webhook/onboarding_sanitized_report_compiled',
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody:
        '={{ JSON.stringify({ correlation_id: $("Code - Preparar contexto ejecucion").first().json.correlation_id, cliente_id: $("Code - Preparar contexto ejecucion").first().json.cliente_id }) }}',
      options: {
        response: {
          response: {
            fullResponse: true,
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
    position: [3120, 192],
  },
});

const buildFinalContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Consolidar cadena auditiva',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const context = $('Code - Preparar contexto ejecucion').first().json;

function normalizeResponse(nodeName) {
  const response = $(nodeName).first().json ?? {};
  const body = response.body ?? response;
  const accepted = body?.accepted === true;
  const workflowName = body?.workflow_name ?? null;
  const statusCode = response.statusCode ?? response.status ?? null;

  return {
    workflow_name: workflowName,
    status_code: statusCode,
    accepted,
    result_summary: body?.result_summary ?? null,
    next_action: body?.next_action ?? null,
    sanitized_result: body?.sanitized_result ?? null
  };
}

const trace = normalizeResponse('HTTP - Call onboarding_trace_verified');
const readiness = normalizeResponse('HTTP - Call onboarding_readiness_revalidated');
const credentials = normalizeResponse('HTTP - Call onboarding_credentials_metadata_checked');
const dispatch = normalizeResponse('HTTP - Call onboarding_dispatch_health_checked');
const report = normalizeResponse('HTTP - Call onboarding_sanitized_report_compiled');
const responses = [trace, readiness, credentials, dispatch, report];
const chainSucceeded = responses.every((item) => item.accepted === true && item.status_code === 202);

return [
  {
    json: {
      workflow_execution_id: context.workflow_execution_id,
      correlation_id: context.correlation_id,
      cliente_id: context.cliente_id,
      payload: context.payload,
      final_status: chainSucceeded ? 'completed' : 'error',
      result_summary: chainSucceeded
        ? 'Onboarding activado con secuencia auditiva automatica completada'
        : 'Onboarding recibido, pero la cadena auditiva automatica no se completo correctamente',
      next_action: chainSucceeded
        ? 'Base lista para automatizacion real de negocio adicional'
        : 'Revisar ejecuciones_workflows por correlation_id y los workflows auditivos encadenados',
      audit_chain_status: chainSucceeded ? 'completed' : 'error',
      sanitized_result: {
        trace,
        readiness,
        credentials,
        dispatch,
        report
      }
    }
  }
];
      `,
    },
    position: [3408, 192],
  },
});

const isChainComplete = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Audit chain complete',
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
    position: [3688, 192],
  },
});

const updateCompleted = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Update ejecucion completed',
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'ejecuciones_workflows',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          { keyName: 'id', condition: 'eq', keyValue: '={{ $json.workflow_execution_id }}' },
          { keyName: 'correlation_id', condition: 'eq', keyValue: '={{ $json.correlation_id }}' },
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'status', fieldValue: 'completed' },
          {
            fieldId: 'input_payload',
            fieldValue:
              '={{ ({ payload: $json.payload, result_summary: $json.result_summary, next_action: $json.next_action, audit_chain_status: $json.audit_chain_status, sanitized_result: $json.sanitized_result }) }}',
          },
          { fieldId: 'finished_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [3968, 96],
  },
});

const respondCompleted = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Webhook - OK',
    parameters: {
      respondWith: 'json',
      responseBody:
        '={{ ({ accepted: true, workflow_name: "onboarding_activated", correlation_id: $("Code - Consolidar cadena auditiva").first().json.correlation_id, audit_chain_status: $("Code - Consolidar cadena auditiva").first().json.audit_chain_status, result_summary: $("Code - Consolidar cadena auditiva").first().json.result_summary, next_action: $("Code - Consolidar cadena auditiva").first().json.next_action }) }}',
      options: {
        responseCode: 202,
      },
    },
    position: [4248, 96],
  },
});

const updateError = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Update ejecucion error',
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'ejecuciones_workflows',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          { keyName: 'id', condition: 'eq', keyValue: '={{ $json.workflow_execution_id }}' },
          { keyName: 'correlation_id', condition: 'eq', keyValue: '={{ $json.correlation_id }}' },
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'status', fieldValue: 'error' },
          {
            fieldId: 'input_payload',
            fieldValue:
              '={{ ({ payload: $json.payload, result_summary: $json.result_summary, next_action: $json.next_action, audit_chain_status: $json.audit_chain_status, sanitized_result: $json.sanitized_result }) }}',
          },
          { fieldId: 'finished_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [3968, 288],
  },
});

const respondAcceptedWithWarning = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Webhook - Accepted with audit warning',
    parameters: {
      respondWith: 'json',
      responseBody:
        '={{ ({ accepted: true, workflow_name: "onboarding_activated", correlation_id: $("Code - Consolidar cadena auditiva").first().json.correlation_id, audit_chain_status: $("Code - Consolidar cadena auditiva").first().json.audit_chain_status, result_summary: $("Code - Consolidar cadena auditiva").first().json.result_summary, next_action: $("Code - Consolidar cadena auditiva").first().json.next_action }) }}',
      options: {
        responseCode: 202,
      },
    },
    position: [4248, 288],
  },
});

const respondBadRequest = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Webhook - Bad Request',
    parameters: {
      respondWith: 'json',
      responseBody:
        '={{ ({ accepted: false, workflow_name: "onboarding_activated", correlation_id: $json.correlation_id, errors: $json.errors }) }}',
      options: {
        responseCode: 400,
      },
    },
    position: [1104, 432],
  },
});

export default workflow('onboarding-activated-v2', 'onboarding_activated')
  .add(webhookTrigger)
  .to(validatePayload)
  .to(
    isPayloadValid
      .onTrue(
        insertExecution
          .to(buildExecutionContext)
          .to(loadSystemStatus)
          .to(callTraceWorkflow)
          .to(callReadinessWorkflow)
          .to(callCredentialsWorkflow)
          .to(callDispatchWorkflow)
          .to(callReportWorkflow)
          .to(buildFinalContext)
          .to(
            isChainComplete
              .onTrue(updateCompleted.to(respondCompleted))
              .onFalse(updateError.to(respondAcceptedWithWarning)),
          ),
      )
      .onFalse(respondBadRequest),
  );
