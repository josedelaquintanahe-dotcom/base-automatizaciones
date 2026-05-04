import { workflow, node, trigger, ifElse, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook - automation_client_invoice_draft_create',
    parameters: {
      httpMethod: 'POST',
      path: 'automation_client_invoice_draft_create',
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
if (!payload.client_snapshot || !payload.client_snapshot.operational_summary) {
  errors.push('client_snapshot sanitario requerido');
}

if (!invoiceMonth) {
  errors.push('request_payload.invoice_month requerido y valido');
}

if (rollbackMode && !invoiceId) {
  errors.push('request_payload.invoice_id requerido en rollback_mode');
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
      invoice_month: invoiceMonth,
    }
  }
];
      `,
    },
    position: [520, 320],
  },
});

const fetchInvoiceForMonth = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Buscar factura del mes',
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
            keyName: 'cliente_id',
            condition: 'eq',
            keyValue: '={{ $("Code - Validar payload").first().json.cliente_id }}',
          },
          {
            keyName: 'mes',
            condition: 'eq',
            keyValue: '={{ $("Code - Validar payload").first().json.invoice_month }}',
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
    name: 'Code - Preparar factura',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const source = $('Code - Validar payload').first().json;
const payload = source.payload ?? {};
const summary = payload.client_snapshot?.operational_summary ?? {};
const billing = summary.billing?.ultima_factura ?? null;
const existingInvoice = $input.first().json ?? null;
const rollbackMode = source.rollback_mode === true;

const rollbackPlan = [
  'Usar rollback_mode para marcar el borrador creado como cancelado',
  'Conservar correlation_id y trazabilidad en ejecuciones_workflows',
  'No crear un segundo borrador del mismo mes mientras exista uno pendiente o pagado',
];

let finalStatus = 'completed';
let actionMode = rollbackMode ? 'rollback' : 'create';
let resultSummary = rollbackMode
  ? 'Borrador de factura mensual cancelado'
  : 'Borrador de factura mensual creado';
let nextAction = rollbackMode
  ? 'Se puede volver a generar un nuevo borrador cuando proceda'
  : 'Revisar el borrador y aprobar su uso operativo antes de automatizaciones externas';
let invoiceStatus = rollbackMode ? 'cancelada' : 'pendiente';
let duplicateBlocked = false;
let billingContextAvailable = Boolean(billing);
let maintenanceAmount = billing && Number.isFinite(Number(billing.mantenimiento_mensual))
  ? Number(billing.mantenimiento_mensual)
  : null;
let totalAmount = maintenanceAmount;
let targetInvoiceId = rollbackMode ? source.invoice_id : null;

if (!source.valid) {
  finalStatus = 'error';
  resultSummary = 'No se pudo procesar la factura por payload incompleto';
  nextAction = 'Revisar el contrato del payload antes de reintentar';
}

if (finalStatus === 'completed' && !rollbackMode && !billingContextAvailable) {
  finalStatus = 'error';
  resultSummary = 'No se pudo crear el borrador porque falta contexto de facturacion';
  nextAction = 'Generar o revisar la ultima factura conocida antes de crear nuevos borradores';
}

if (finalStatus === 'completed' && !rollbackMode && !(maintenanceAmount > 0)) {
  finalStatus = 'error';
  resultSummary = 'No se pudo crear el borrador porque el mantenimiento mensual no es valido';
  nextAction = 'Revisar el importe de facturacion del cliente antes de reintentar';
}

if (finalStatus === 'completed' && !rollbackMode && existingInvoice?.id) {
  finalStatus = 'error';
  duplicateBlocked = true;
  resultSummary = 'Ya existe una factura para el mes solicitado y no se crea un segundo borrador';
  nextAction = 'Usar otro mes o revisar la factura ya existente antes de crear una nueva';
  targetInvoiceId = existingInvoice.id;
  invoiceStatus = existingInvoice.estado ?? 'desconocido';
}

if (finalStatus === 'completed' && rollbackMode && !existingInvoice?.id) {
  finalStatus = 'error';
  resultSummary = 'No se encontro la factura del mes para aplicar rollback';
  nextAction = 'Verificar invoice_month e invoice_id antes de reintentar el rollback';
}

if (finalStatus === 'completed' && rollbackMode && existingInvoice?.id && source.invoice_id && existingInvoice.id !== source.invoice_id) {
  finalStatus = 'error';
  resultSummary = 'La factura localizada no coincide con invoice_id y no se aplica rollback';
  nextAction = 'Usar el invoice_id real del borrador creado en la validacion';
}

if (finalStatus === 'completed' && rollbackMode && existingInvoice?.estado === 'pagada') {
  finalStatus = 'error';
  resultSummary = 'No se aplica rollback sobre una factura ya pagada';
  nextAction = 'Resolver manualmente la factura pagada antes de automatizar rollback';
}

if (finalStatus === 'completed' && rollbackMode && existingInvoice?.estado === 'cancelada') {
  finalStatus = 'error';
  resultSummary = 'La factura ya estaba cancelada y no requiere rollback';
  nextAction = 'Usar otro borrador o revisar el historial antes de reintentar';
}

if (rollbackMode && existingInvoice?.id) {
  targetInvoiceId = existingInvoice.id;
  maintenanceAmount = Number(existingInvoice.mantenimiento_mensual ?? maintenanceAmount ?? 0) || maintenanceAmount;
  totalAmount = Number(existingInvoice.total ?? totalAmount ?? 0) || totalAmount;
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
      invoice_id: targetInvoiceId,
      invoice_month: source.invoice_month,
      invoice_status: invoiceStatus,
      maintenance_amount: maintenanceAmount,
      total_amount: totalAmount,
      sanitized_result: {
        action_mode: actionMode,
        invoice_id: targetInvoiceId,
        invoice_month: source.invoice_month,
        invoice_status: invoiceStatus,
        maintenance_amount: maintenanceAmount,
        total_amount: totalAmount,
        rollback_mode: rollbackMode,
        billing_context_available: billingContextAvailable,
        duplicate_blocked: duplicateBlocked,
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
          { fieldId: 'workflow_name', fieldValue: 'automation_client_invoice_draft_create' },
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
const prepared = $('Code - Preparar factura').first().json;

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
      invoice_status: prepared.invoice_status,
      maintenance_amount: prepared.maintenance_amount,
      total_amount: prepared.total_amount,
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

const checkRollbackMode = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Rollback mode',
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: 'strict' },
        conditions: [
          {
            leftValue: '={{ $json.action_mode === "rollback" }}',
            operator: { type: 'boolean', operation: 'true' },
            rightValue: true,
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
    position: [2270, 320],
  },
});

const createInvoiceDraft = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Crear factura borrador',
    parameters: {
      resource: 'row',
      operation: 'create',
      tableId: 'facturas',
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'cliente_id', fieldValue: '={{ $json.cliente_id }}' },
          { fieldId: 'mes', fieldValue: '={{ $json.invoice_month }}' },
          { fieldId: 'setup_inicial', fieldValue: '0' },
          { fieldId: 'mantenimiento_mensual', fieldValue: '={{ $json.maintenance_amount }}' },
          { fieldId: 'total', fieldValue: '={{ $json.total_amount }}' },
          { fieldId: 'estado', fieldValue: 'pendiente' },
        ],
      },
    },
    position: [2550, 220],
  },
});

const finalizeCreate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Finalizar create',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const created = $input.first().json;
const base = $('Code - Contexto update base').first().json;

return [
  {
    json: {
      ...base,
      invoice_id: created.id ?? base.invoice_id,
      invoice_status: created.estado ?? 'pendiente',
      sanitized_result: {
        ...base.sanitized_result,
        invoice_id: created.id ?? base.invoice_id,
        invoice_status: created.estado ?? 'pendiente',
      }
    }
  }
];
      `,
    },
    position: [2830, 220],
  },
});

const cancelInvoiceDraft = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Cancelar factura',
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
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'estado', fieldValue: 'cancelada' },
        ],
      },
    },
    position: [2550, 420],
  },
});

const finalizeRollback = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Finalizar rollback',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const updated = $input.first().json;
const base = $('Code - Contexto update base').first().json;

return [
  {
    json: {
      ...base,
      invoice_id: updated.id ?? base.invoice_id,
      invoice_status: updated.estado ?? 'cancelada',
      sanitized_result: {
        ...base.sanitized_result,
        invoice_id: updated.id ?? base.invoice_id,
        invoice_status: updated.estado ?? 'cancelada',
      }
    }
  }
];
      `,
    },
    position: [2830, 420],
  },
});

const updateCompletedCreate = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Update completed create',
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'ejecuciones_workflows',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          { keyName: 'id', condition: 'eq', keyValue: '={{ $("Code - Finalizar create").first().json.workflow_execution_id }}' },
          { keyName: 'correlation_id', condition: 'eq', keyValue: '={{ $("Code - Finalizar create").first().json.correlation_id }}' },
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'status', fieldValue: 'completed' },
          {
            fieldId: 'input_payload',
            fieldValue:
              '={{ { automation_id: $("Code - Finalizar create").first().json.automation_id, result_summary: $("Code - Finalizar create").first().json.result_summary, next_action: $("Code - Finalizar create").first().json.next_action, sanitized_result: $("Code - Finalizar create").first().json.sanitized_result } }}',
          },
          { fieldId: 'finished_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [3110, 220],
  },
});

const respondOkCreate = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Webhook - OK create',
    parameters: {
      respondWith: 'json',
      responseBody:
        '={{ ({ accepted: true, workflow_name: "automation_client_invoice_draft_create", correlation_id: $("Code - Finalizar create").first().json.correlation_id, automation_id: $("Code - Finalizar create").first().json.automation_id, result_summary: $("Code - Finalizar create").first().json.result_summary, next_action: $("Code - Finalizar create").first().json.next_action, sanitized_result: $("Code - Finalizar create").first().json.sanitized_result }) }}',
      options: { responseCode: 202 },
    },
    position: [3390, 220],
  },
});

const updateCompletedRollback = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Update completed rollback',
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'ejecuciones_workflows',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          { keyName: 'id', condition: 'eq', keyValue: '={{ $("Code - Finalizar rollback").first().json.workflow_execution_id }}' },
          { keyName: 'correlation_id', condition: 'eq', keyValue: '={{ $("Code - Finalizar rollback").first().json.correlation_id }}' },
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'status', fieldValue: 'completed' },
          {
            fieldId: 'input_payload',
            fieldValue:
              '={{ { automation_id: $("Code - Finalizar rollback").first().json.automation_id, result_summary: $("Code - Finalizar rollback").first().json.result_summary, next_action: $("Code - Finalizar rollback").first().json.next_action, sanitized_result: $("Code - Finalizar rollback").first().json.sanitized_result } }}',
          },
          { fieldId: 'finished_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [3110, 420],
  },
});

const respondOkRollback = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond to Webhook - OK rollback',
    parameters: {
      respondWith: 'json',
      responseBody:
        '={{ ({ accepted: true, workflow_name: "automation_client_invoice_draft_create", correlation_id: $("Code - Finalizar rollback").first().json.correlation_id, automation_id: $("Code - Finalizar rollback").first().json.automation_id, result_summary: $("Code - Finalizar rollback").first().json.result_summary, next_action: $("Code - Finalizar rollback").first().json.next_action, sanitized_result: $("Code - Finalizar rollback").first().json.sanitized_result }) }}',
      options: { responseCode: 202 },
    },
    position: [3390, 420],
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
          { keyName: 'id', condition: 'eq', keyValue: '={{ $("Code - Contexto update base").first().json.workflow_execution_id }}' },
          { keyName: 'correlation_id', condition: 'eq', keyValue: '={{ $("Code - Contexto update base").first().json.correlation_id }}' },
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'status', fieldValue: 'error' },
          {
            fieldId: 'input_payload',
            fieldValue:
              '={{ { automation_id: $("Code - Contexto update base").first().json.automation_id, result_summary: $("Code - Contexto update base").first().json.result_summary, next_action: $("Code - Contexto update base").first().json.next_action, sanitized_result: $("Code - Contexto update base").first().json.sanitized_result } }}',
          },
          { fieldId: 'finished_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [2550, 620],
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
        '={{ ({ accepted: false, workflow_name: "automation_client_invoice_draft_create", correlation_id: $("Code - Contexto update base").first().json.correlation_id, automation_id: $("Code - Contexto update base").first().json.automation_id, result_summary: $("Code - Contexto update base").first().json.result_summary, next_action: $("Code - Contexto update base").first().json.next_action, sanitized_result: $("Code - Contexto update base").first().json.sanitized_result }) }}',
      options: { responseCode: 422 },
    },
    position: [2830, 620],
  },
});

export default workflow(
  'automation-client-invoice-draft-create-v1',
  'automation_client_invoice_draft_create',
)
  .add(webhookTrigger)
  .to(validatePayload)
  .to(fetchInvoiceForMonth)
  .to(prepareInvoice)
  .to(insertExecution)
  .to(buildBaseContext)
  .to(
    checkOperable
      .onTrue(
        checkRollbackMode
          .onTrue(cancelInvoiceDraft.to(finalizeRollback).to(updateCompletedRollback).to(respondOkRollback))
          .onFalse(createInvoiceDraft.to(finalizeCreate).to(updateCompletedCreate).to(respondOkCreate)),
      )
      .onFalse(updateError.to(respondError)),
  );
