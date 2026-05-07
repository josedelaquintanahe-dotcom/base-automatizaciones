import { workflow, node, trigger, ifElse, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook - automation_client_invoice_mark_paid',
    parameters: {
      httpMethod: 'POST',
      path: 'automation_client_invoice_mark_paid',
      responseMode: 'responseNode',
      options: {},
    },
    position: [240, 320],
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
const requestedPayload = payload.request_payload ?? {};
const rollbackMode = requestedPayload.rollback_mode === true;
const invoiceId = requestedPayload.invoice_id ?? null;
const expectedStatus = requestedPayload.expected_status ?? 'pendiente';
const rawInvoiceMonth = requestedPayload.invoice_month ?? null;

function normalizeInvoiceMonth(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  return \`\${year}-\${month}-01\`;
}

const invoiceMonth = normalizeInvoiceMonth(rawInvoiceMonth);

if (!payload.correlation_id) errors.push('correlation_id requerido');
if (!payload.cliente_id) errors.push('cliente_id requerido');
if (!payload.automation_id) errors.push('automation_id requerido');
if (!payload.workflow_name) errors.push('workflow_name requerido');
if (payload.workflow_name && payload.workflow_name !== 'automation_client_invoice_mark_paid') {
  errors.push('workflow_name invalido para automation_client_invoice_mark_paid');
}
if (!payload.trigger_source) errors.push('trigger_source requerido');
if (!payload.client_snapshot || !payload.client_snapshot.operational_summary) {
  errors.push('client_snapshot sanitario requerido');
}
if (!invoiceId) errors.push('request_payload.invoice_id requerido');
if (!rollbackMode && expectedStatus !== 'pendiente') {
  errors.push('request_payload.expected_status debe ser pendiente en modo normal');
}

return [
  {
    json: {
      valid: errors.length === 0,
      errors,
      payload,
      correlation_id: payload.correlation_id ?? null,
      cliente_id: payload.cliente_id ?? null,
      automation_id: payload.automation_id ?? null,
      rollback_mode: rollbackMode,
      requested_scope: requestedPayload.scope ?? null,
      invoice_id: invoiceId,
      expected_status: expectedStatus,
      invoice_month: invoiceMonth,
    }
  }
];
      `,
    },
    position: [520, 320],
  },
});

const fetchInvoice = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Buscar factura',
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'getAll',
      tableId: 'facturas',
      returnAll: false,
      limit: 1,
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          {
            keyName: 'id',
            condition: 'eq',
            keyValue: '={{ $("Code - Validar payload").first().json.invoice_id }}',
          },
          {
            keyName: 'cliente_id',
            condition: 'eq',
            keyValue: '={{ $("Code - Validar payload").first().json.cliente_id }}',
          },
        ],
      },
    },
    position: [820, 320],
  },
});

const prepareInvoice = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Preparar transicion',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const source = $('Code - Validar payload').first().json;
const payload = source.payload ?? {};
const billing = payload.client_snapshot?.operational_summary?.billing ?? null;
const invoice = $input.first().json ?? null;
const rollbackMode = source.rollback_mode === true;
const previousStatus = invoice?.estado ?? null;
const targetStatus = rollbackMode ? 'pendiente' : 'pagada';
const invoiceMonth = source.invoice_month ?? invoice?.mes ?? null;

const rollbackPlan = [
  'Usar rollback_mode para restaurar la misma factura al estado pendiente',
  'Conservar correlation_id y trazabilidad en ejecuciones_workflows',
  'Resolver manualmente cualquier estado cancelada o pagada fuera del flujo previsto',
];

let finalStatus = 'completed';
let actionMode = rollbackMode ? 'rollback' : 'mark_paid';
let resultSummary = rollbackMode
  ? 'Factura restaurada a pendiente'
  : 'Factura marcada como pagada';
let nextAction = rollbackMode
  ? 'La factura vuelve a estado pendiente y puede revisarse antes de otro intento'
  : 'Confirmar conciliacion o continuar con el siguiente paso operativo de facturacion';
let statusTransitionAllowed = true;
let billingContextAvailable = Boolean(billing);

if (!source.valid) {
  finalStatus = 'error';
  resultSummary = 'No se pudo procesar la factura por payload incompleto';
  nextAction = 'Revisar el contrato del payload antes de reintentar';
  statusTransitionAllowed = false;
}

if (finalStatus === 'completed' && !invoice?.id) {
  finalStatus = 'error';
  resultSummary = 'No se encontro la factura solicitada para el cliente indicado';
  nextAction = 'Verificar invoice_id y cliente_id antes de reintentar';
  statusTransitionAllowed = false;
}

if (finalStatus === 'completed' && !rollbackMode && previousStatus !== source.expected_status) {
  finalStatus = 'error';
  resultSummary = 'La factura no esta en el estado esperado y no se marca como pagada';
  nextAction = 'Resolver manualmente el estado actual antes de reintentar';
  statusTransitionAllowed = false;
}

if (finalStatus === 'completed' && rollbackMode && previousStatus !== 'pagada') {
  finalStatus = 'error';
  resultSummary = 'La factura no esta pagada y no se puede restaurar a pendiente';
  nextAction = 'Verificar si la factura ya fue revertida o requiere revision manual';
  statusTransitionAllowed = false;
}

return [
  {
    json: {
      correlation_id: source.correlation_id,
      cliente_id: source.cliente_id,
      automation_id: source.automation_id,
      final_status: finalStatus,
      action_mode: actionMode,
      result_summary: resultSummary,
      next_action: nextAction,
      invoice_id: source.invoice_id,
      invoice_month: invoiceMonth,
      previous_status: previousStatus,
      invoice_status: targetStatus,
      sanitized_result: {
        action_mode: actionMode,
        invoice_id: source.invoice_id,
        invoice_month: invoiceMonth,
        previous_status: previousStatus,
        invoice_status: targetStatus,
        rollback_mode: rollbackMode,
        billing_context_available: billingContextAvailable,
        status_transition_allowed: statusTransitionAllowed,
        rollback_plan: rollbackPlan,
      }
    }
  }
];
      `,
    },
    position: [1120, 320],
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
          { fieldId: 'workflow_name', fieldValue: 'automation_client_invoice_mark_paid' },
          { fieldId: 'execution_source', fieldValue: 'n8n_webhook' },
          { fieldId: 'correlation_id', fieldValue: '={{ $json.correlation_id }}' },
          { fieldId: 'cliente_id', fieldValue: '={{ $json.cliente_id }}' },
          { fieldId: 'status', fieldValue: 'received' },
          { fieldId: 'input_payload', fieldValue: '={{ $json }}' },
          { fieldId: 'started_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [1420, 320],
  },
});

const buildBaseContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Contexto update base',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const execution = $input.first().json;
const prepared = $('Code - Preparar transicion').first().json;
const source = $('Code - Validar payload').first().json;

return [
  {
    json: {
      workflow_execution_id: execution.id ?? null,
      automation_id: prepared.automation_id,
      correlation_id: prepared.correlation_id,
      cliente_id: prepared.cliente_id,
      final_status: prepared.final_status,
      action_mode: prepared.action_mode,
      result_summary: prepared.result_summary,
      next_action: prepared.next_action,
      invoice_id: prepared.invoice_id,
      invoice_month: prepared.invoice_month,
      previous_status: prepared.previous_status,
      invoice_status: prepared.invoice_status,
      request_payload: source.payload ?? null,
      sanitized_result: prepared.sanitized_result,
    }
  }
];
      `,
    },
    position: [1710, 320],
  },
});

const checkOperable = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Factura operable',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'strict' },
        conditions: [
          {
            leftValue: '={{ $json.final_status === "completed" }}',
            operator: { type: 'boolean', operation: 'true' },
            rightValue: true,
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
    position: [1990, 320],
  },
});

const updateInvoiceStatus = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Actualizar estado factura',
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'facturas',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          { keyName: 'id', condition: 'eq', keyValue: '={{ $json.invoice_id }}' },
          { keyName: 'cliente_id', condition: 'eq', keyValue: '={{ $json.cliente_id }}' },
          { keyName: 'estado', condition: 'eq', keyValue: '={{ $json.previous_status }}' },
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'estado', fieldValue: '={{ $json.invoice_status }}' },
        ],
      },
    },
    position: [2270, 220],
  },
});

const finalizeTransition = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Finalizar transicion',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const updated = $input.first().json ?? null;
const base = $('Code - Contexto update base').first().json;
const updateApplied = Boolean(updated?.id);

let finalStatus = base.final_status;
let resultSummary = base.result_summary;
let nextAction = base.next_action;
let invoiceStatus = updated?.estado ?? base.invoice_status;
let statusTransitionAllowed = base.sanitized_result?.status_transition_allowed ?? true;

if (!updateApplied) {
  finalStatus = 'error';
  resultSummary = 'La factura cambio de estado antes de aplicar la transicion y no se confirmo la mutacion';
  nextAction = 'Revisar el estado actual de la factura y relanzar el flujo solo si sigue siendo seguro';
  invoiceStatus = base.previous_status ?? base.invoice_status;
  statusTransitionAllowed = false;
}

return [
  {
    json: {
      ...base,
      final_status: finalStatus,
      result_summary: resultSummary,
      next_action: nextAction,
      invoice_id: updated?.id ?? base.invoice_id,
      previous_status: base.previous_status,
      invoice_status: invoiceStatus,
      sanitized_result: {
        ...base.sanitized_result,
        invoice_id: updated?.id ?? base.invoice_id,
        invoice_status: invoiceStatus,
        status_transition_allowed: statusTransitionAllowed,
      }
    }
  }
];
      `,
    },
    position: [2550, 220],
  },
});

const checkTransitionApplied = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Transicion confirmada',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'strict' },
        conditions: [
          {
            leftValue: '={{ $json.final_status === "completed" }}',
            operator: { type: 'boolean', operation: 'true' },
            rightValue: true,
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
    position: [2830, 220],
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
              '={{ { request_payload: $json.request_payload, automation_id: $json.automation_id, result_summary: $json.result_summary, next_action: $json.next_action, sanitized_result: $json.sanitized_result } }}',
          },
          { fieldId: 'finished_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [2830, 220],
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
        '={{ ({ accepted: true, workflow_name: "automation_client_invoice_mark_paid", correlation_id: $json.correlation_id, automation_id: $json.automation_id, result_summary: $json.result_summary, next_action: $json.next_action, sanitized_result: $json.sanitized_result }) }}',
      options: { responseCode: 202 },
    },
    position: [3110, 220],
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
              '={{ { request_payload: $json.request_payload, automation_id: $json.automation_id, result_summary: $json.result_summary, next_action: $json.next_action, sanitized_result: $json.sanitized_result } }}',
          },
          { fieldId: 'finished_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [2270, 420],
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
        '={{ ({ accepted: false, workflow_name: "automation_client_invoice_mark_paid", correlation_id: $json.correlation_id, automation_id: $json.automation_id, result_summary: $json.result_summary, next_action: $json.next_action, sanitized_result: $json.sanitized_result }) }}',
      options: { responseCode: 422 },
    },
    position: [2550, 420],
  },
});

export default workflow(
  'automation-client-invoice-mark-paid-v1',
  'automation_client_invoice_mark_paid',
)
  .add(webhookTrigger)
  .to(validatePayload)
  .to(fetchInvoice)
  .to(prepareInvoice)
  .to(insertExecution)
  .to(buildBaseContext)
  .to(
    checkOperable
      .onTrue(
        updateInvoiceStatus.to(
          finalizeTransition.to(
            checkTransitionApplied
              .onTrue(updateCompleted.to(respondOk))
              .onFalse(updateError.to(respondError)),
          ),
        ),
      )
      .onFalse(updateError.to(respondError)),
  );
