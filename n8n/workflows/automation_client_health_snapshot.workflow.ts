import { workflow, node, trigger, ifElse, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook - automation_client_health_snapshot',
    parameters: {
      httpMethod: 'POST',
      path: 'automation_client_health_snapshot',
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
if (!payload.automation_id) errors.push('automation_id requerido');
if (!payload.workflow_name) errors.push('workflow_name requerido');
if (!payload.client_snapshot || !payload.client_snapshot.operational_summary) {
  errors.push('client_snapshot sanitario requerido');
}

return [
  {
    json: {
      valid: errors.length === 0,
      errors,
      payload,
      correlation_id: payload.correlation_id ?? null,
      cliente_id: payload.cliente_id ?? null,
      automation_id: payload.automation_id ?? null
    }
  }
];
      `,
    },
    position: [520, 300],
  },
});

const buildSnapshot = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Preparar snapshot',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const source = $input.first().json;
const payload = source.payload ?? {};
const clientSnapshot = payload.client_snapshot ?? {};
const operationalSummary = clientSnapshot.operational_summary ?? {};
const automationReadiness = clientSnapshot.automation_readiness ?? {};
const credentialsSummary = operationalSummary.credenciales ?? {};
const accessSummary = operationalSummary.access ?? {};
const billingSummary = operationalSummary.billing ?? {};
const ready = Boolean(source.valid && automationReadiness.ready);

return [
  {
    json: {
      correlation_id: source.correlation_id,
      cliente_id: source.cliente_id,
      automation_id: source.automation_id,
      final_status: ready ? 'completed' : 'error',
      result_summary: ready
        ? 'Snapshot sanitario del cliente generado'
        : 'No se pudo generar el snapshot sanitario por payload incompleto o readiness no valido',
      next_action: ready
        ? 'Mantener disponible para ejecuciones manuales o futuras programaciones'
        : 'Revisar readiness del cliente antes de reutilizar la automatizacion',
      sanitized_result: {
        onboarding_status: operationalSummary.onboarding_status ?? null,
        credenciales_activas: credentialsSummary.activas ?? 0,
        token_operativo_activo: accessSummary.token_operativo_activo ?? false,
        factura_inicial_emitida: billingSummary.factura_inicial_emitida ?? false,
        readiness_ready: automationReadiness.ready ?? false,
        requested_scope: payload.request_payload?.scope ?? null
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
            fieldValue: 'automation_client_health_snapshot',
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
const snapshot = $('Code - Preparar snapshot').first().json;

return [
  {
    json: {
      workflow_execution_id: execution.id ?? null,
      automation_id: snapshot.automation_id,
      correlation_id: snapshot.correlation_id,
      cliente_id: snapshot.cliente_id,
      final_status: snapshot.final_status,
      result_summary: snapshot.result_summary,
      next_action: snapshot.next_action,
      sanitized_result: snapshot.sanitized_result
    }
  }
];
      `,
    },
    position: [1408, 300],
  },
});

const checkSnapshot = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Snapshot ready',
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
            fieldValue:
              '={{ { automation_id: $json.automation_id, result_summary: $json.result_summary, next_action: $json.next_action, sanitized_result: $json.sanitized_result } }}',
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
      responseBody:
        '={{ ({ accepted: true, workflow_name: "automation_client_health_snapshot", correlation_id: $("Code - Contexto update").first().json.correlation_id, automation_id: $("Code - Contexto update").first().json.automation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
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
            fieldValue:
              '={{ { automation_id: $json.automation_id, result_summary: $json.result_summary, next_action: $json.next_action, sanitized_result: $json.sanitized_result } }}',
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
      responseBody:
        '={{ ({ accepted: false, workflow_name: "automation_client_health_snapshot", correlation_id: $("Code - Contexto update").first().json.correlation_id, automation_id: $("Code - Contexto update").first().json.automation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
      options: {
        responseCode: 422,
      },
    },
    position: [2248, 432],
  },
});

export default workflow(
  'automation-client-health-snapshot-v1',
  'automation_client_health_snapshot',
)
  .add(webhookTrigger)
  .to(validatePayload)
  .to(buildSnapshot)
  .to(insertExecution)
  .to(buildUpdateContext)
  .to(
    checkSnapshot
      .onTrue(updateCompleted.to(respondOk))
      .onFalse(updateError.to(respondError)),
  );
