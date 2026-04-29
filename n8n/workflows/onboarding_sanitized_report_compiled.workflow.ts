import { workflow, node, trigger, ifElse, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook - onboarding_sanitized_report_compiled',
    parameters: {
      httpMethod: 'POST',
      path: 'onboarding_sanitized_report_compiled',
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

return [
  {
    json: {
      valid: errors.length === 0,
      errors,
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

const loadExecutions = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Get workflow executions',
    parameters: {
      resource: 'row',
      operation: 'getAll',
      tableId: 'ejecuciones_workflows',
      returnAll: false,
      limit: 20,
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          {
            keyName: 'correlation_id',
            condition: 'eq',
            keyValue: '={{ $("Code - Validar payload").first().json.correlation_id }}',
          },
        ],
      },
    },
    position: [816, 300],
  },
});

const buildReportContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Preparar reporte',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const source = $('Code - Validar payload').first().json;
const rows = $input.all().map((item) => item.json);
const requiredWorkflows = [
  'onboarding_trace_verified',
  'onboarding_readiness_revalidated',
  'onboarding_credentials_metadata_checked',
  'onboarding_dispatch_health_checked'
];
const latestByWorkflow = new Map();

for (const row of rows) {
  const name = row.workflow_name;
  if (!name) continue;
  if (!latestByWorkflow.has(name)) {
    latestByWorkflow.set(name, row);
  }
}

const checks = requiredWorkflows.map((workflowName) => {
  const row = latestByWorkflow.get(workflowName) ?? null;
  return {
    workflow_name: workflowName,
    status: row?.status ?? 'missing'
  };
});

const allChecksPassed = checks.every((item) => item.status === 'completed');

return [
  {
    json: {
      correlation_id: source.correlation_id,
      cliente_id: source.cliente_id,
      final_status: source.valid && allChecksPassed ? 'completed' : 'error',
      result_summary: source.valid && allChecksPassed
        ? 'Secuencia de auditoria post-onboarding consolidada'
        : 'La secuencia auditiva no esta completa o contiene checks no consolidados',
      next_action: source.valid && allChecksPassed
        ? 'Lista para futura ampliacion funcional de bajo riesgo'
        : 'Revisar los checks faltantes o fallidos antes de continuar',
      sanitized_result: {
        checks: checks.map((item) => item.workflow_name),
        check_statuses: checks,
        all_checks_passed: allChecksPassed
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
            fieldValue: 'onboarding_sanitized_report_compiled',
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
const verification = $('Code - Preparar reporte').first().json;

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

const checkReport = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Report complete',
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
      responseBody: '={{ ({ accepted: true, workflow_name: "onboarding_sanitized_report_compiled", correlation_id: $("Code - Contexto update").first().json.correlation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
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
      responseBody: '={{ ({ accepted: false, workflow_name: "onboarding_sanitized_report_compiled", correlation_id: $("Code - Contexto update").first().json.correlation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
      options: {
        responseCode: 422,
      },
    },
    position: [2544, 432],
  },
});

export default workflow('onboarding-sanitized-report-compiled-v1', 'onboarding_sanitized_report_compiled')
  .add(webhookTrigger)
  .to(validatePayload)
  .to(loadExecutions)
  .to(buildReportContext)
  .to(insertExecution)
  .to(buildUpdateContext)
  .to(
    checkReport
      .onTrue(updateCompleted.to(respondOk))
      .onFalse(updateError.to(respondError)),
  );
