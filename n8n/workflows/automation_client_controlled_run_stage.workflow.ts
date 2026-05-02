import { workflow, node, trigger, ifElse, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook - automation_client_controlled_run_stage',
    parameters: {
      httpMethod: 'POST',
      path: 'automation_client_controlled_run_stage',
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
const requestedPayload = payload.request_payload ?? {};
const requestedFirstRunAt = requestedPayload.requested_first_run_at ?? null;
const rollbackMode = requestedPayload.rollback_mode === true;
const previousNextRun = requestedPayload.previous_next_run ?? null;
let requestedFirstRunIso = null;
let previousNextRunIso = null;

if (!payload.correlation_id) errors.push('correlation_id requerido');
if (!payload.cliente_id) errors.push('cliente_id requerido');
if (!payload.automation_id) errors.push('automation_id requerido');
if (!payload.workflow_name) errors.push('workflow_name requerido');
if (!payload.client_snapshot || !payload.client_snapshot.operational_summary) {
  errors.push('client_snapshot sanitario requerido');
}
if (!payload.client_snapshot || !payload.client_snapshot.automation_readiness) {
  errors.push('automation_readiness requerido');
}
if (!requestedPayload.target_workflow_id) {
  errors.push('request_payload.target_workflow_id requerido');
}
if (!rollbackMode && !requestedFirstRunAt) {
  errors.push('request_payload.requested_first_run_at requerido');
} else if (requestedFirstRunAt) {
  const parsed = new Date(requestedFirstRunAt);
  if (Number.isNaN(parsed.getTime())) {
    errors.push('requested_first_run_at debe ser una fecha ISO valida');
  } else {
    requestedFirstRunIso = parsed.toISOString();
  }
}

if (previousNextRun) {
  const parsedPrevious = new Date(previousNextRun);
  if (Number.isNaN(parsedPrevious.getTime())) {
    errors.push('previous_next_run debe ser una fecha ISO valida si se envia');
  } else {
    previousNextRunIso = parsedPrevious.toISOString();
  }
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
      target_workflow_id: requestedPayload.target_workflow_id ?? null,
      requested_first_run_at: requestedFirstRunIso,
      previous_next_run: previousNextRunIso,
      rollback_mode: rollbackMode,
      requested_scope: requestedPayload.scope ?? null,
      requested_run_window: requestedPayload.run_window ?? 'manual_controlled',
    }
  }
];
      `,
    },
    position: [520, 300],
  },
});

const fetchTargetAutomation = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Buscar automatizacion objetivo',
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'getAll',
      tableId: 'automatizaciones',
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
            keyName: 'n8n_workflow_id',
            condition: 'eq',
            keyValue: '={{ $("Code - Validar payload").first().json.target_workflow_id }}',
          },
        ],
      },
    },
    position: [816, 300],
  },
});

const buildStage = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Preparar staging',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const source = $('Code - Validar payload').first().json;
const payload = source.payload ?? {};
const clientSnapshot = payload.client_snapshot ?? {};
const automationReadiness = clientSnapshot.automation_readiness ?? {};
const targetRow = $input.first().json ?? null;
const rollbackPlan = [];
const missingRequirements = Array.isArray(automationReadiness.missing_requirements)
  ? automationReadiness.missing_requirements
  : [];
const rollbackMode = source.rollback_mode === true;
const targetNextRunValue = rollbackMode ? source.previous_next_run ?? null : source.requested_first_run_at;

let finalStatus = 'completed';
let resultSummary = rollbackMode
  ? 'Rollback de staging aplicado sobre la automatizacion objetivo'
  : 'Primera ejecucion controlada programada';
let nextAction = rollbackMode
  ? 'Verificar que la automatizacion objetivo vuelve a su ventana previa antes de seguir'
  : 'Usar el handoff y ejecutar la automatizacion objetivo en la ventana programada';
let stageStatus = rollbackMode ? 'rollback_restored' : 'scheduled_for_controlled_run';

if (!source.valid) {
  finalStatus = 'error';
  resultSummary = 'No se pudo programar la primera ejecucion controlada por payload incompleto';
  nextAction = 'Revisar el contrato del payload antes de reintentar';
  stageStatus = 'blocked_invalid_payload';
}

if (finalStatus === 'completed' && !automationReadiness.ready) {
  finalStatus = 'error';
  resultSummary = 'No se pudo programar la primera ejecucion controlada porque el cliente no supera readiness';
  nextAction = automationReadiness.next_recommended_action ?? 'Resolver bloqueos antes de programar la primera ejecucion';
  stageStatus = 'blocked_readiness';
}

if (finalStatus === 'completed' && !targetRow?.id) {
  finalStatus = 'error';
  resultSummary = 'No se pudo programar la primera ejecucion controlada porque falta la automatizacion objetivo';
  nextAction = 'Provisionar o revisar target_workflow_id antes de reintentar';
  stageStatus = 'blocked_target_not_found';
}

if (finalStatus === 'completed' && targetRow.n8n_workflow_id === payload.workflow_name) {
  finalStatus = 'error';
  resultSummary = 'No se puede programar la propia automatizacion de staging como objetivo';
  nextAction = 'Elegir una automatizacion objetivo distinta del workflow de staging';
  stageStatus = 'blocked_self_target';
}

if (finalStatus === 'completed' && targetRow.estado !== 'activo') {
  finalStatus = 'error';
  resultSummary = 'La automatizacion objetivo no esta activa y no se programa la primera ejecucion controlada';
  nextAction = 'Reactivar o revisar la automatizacion objetivo antes de programarla';
  stageStatus = 'blocked_target_inactive';
}

rollbackPlan.push('Restaurar proxima_ejecucion al valor previo si la programacion se considera invalida');
rollbackPlan.push('Mantener trazabilidad por correlation_id y conservar el resultado tecnico del staging');
rollbackPlan.push('Si hiciera falta, pausar manualmente la automatizacion objetivo antes del primer arranque');

return [
  {
    json: {
      correlation_id: source.correlation_id,
      cliente_id: source.cliente_id,
      automation_id: source.automation_id,
      final_status: finalStatus,
      result_summary: resultSummary,
      next_action: nextAction,
      target_automation_id: targetRow?.id ?? null,
      target_workflow_id: targetRow?.n8n_workflow_id ?? source.target_workflow_id,
      target_nombre: targetRow?.nombre ?? null,
      target_previous_status: targetRow?.estado ?? null,
      target_previous_next_run: targetRow?.proxima_ejecucion ?? null,
      scheduled_first_run_at: source.requested_first_run_at,
      target_next_run_value: targetNextRunValue,
      sanitized_result: {
        stage_status: stageStatus,
        go_live_ready: Boolean(automationReadiness.ready),
        target_automation_id: targetRow?.id ?? null,
        target_workflow_id: targetRow?.n8n_workflow_id ?? source.target_workflow_id,
        target_nombre: targetRow?.nombre ?? null,
        target_previous_status: targetRow?.estado ?? null,
        target_previous_next_run: targetRow?.proxima_ejecucion ?? null,
        scheduled_first_run_at: source.requested_first_run_at,
        target_next_run_value: targetNextRunValue,
        run_window: source.requested_run_window,
        rollback_mode: rollbackMode,
        requested_scope: source.requested_scope,
        rollback_plan: rollbackPlan,
        blocking_requirements_count: missingRequirements.length
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
          { fieldId: 'workflow_name', fieldValue: 'automation_client_controlled_run_stage' },
          { fieldId: 'execution_source', fieldValue: 'n8n_webhook' },
          { fieldId: 'correlation_id', fieldValue: '={{ $json.correlation_id }}' },
          { fieldId: 'cliente_id', fieldValue: '={{ $json.cliente_id }}' },
          { fieldId: 'status', fieldValue: 'received' },
          { fieldId: 'input_payload', fieldValue: '={{ $json }}' },
          { fieldId: 'started_at', fieldValue: '={{ $now.toISO() }}' },
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
const stage = $('Code - Preparar staging').first().json;

return [
  {
    json: {
      workflow_execution_id: execution.id ?? null,
      automation_id: stage.automation_id,
      correlation_id: stage.correlation_id,
      cliente_id: stage.cliente_id,
      final_status: stage.final_status,
      result_summary: stage.result_summary,
      next_action: stage.next_action,
      target_automation_id: stage.target_automation_id,
      target_workflow_id: stage.target_workflow_id,
      scheduled_first_run_at: stage.scheduled_first_run_at,
      target_next_run_value: stage.target_next_run_value,
      sanitized_result: stage.sanitized_result
    }
  }
];
      `,
    },
    position: [1688, 300],
  },
});

const checkStage = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Stage ready',
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
    position: [1968, 300],
  },
});

const updateTargetAutomation = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  credentials: {
    supabaseApi: newCredential('Supabase'),
  },
  config: {
    name: 'Supabase - Programar automatizacion objetivo',
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'automatizaciones',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          { keyName: 'id', condition: 'eq', keyValue: '={{ $json.target_automation_id }}' },
          { keyName: 'cliente_id', condition: 'eq', keyValue: '={{ $json.cliente_id }}' },
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'proxima_ejecucion', fieldValue: '={{ $json.target_next_run_value }}' },
        ],
      },
    },
    position: [2248, 192],
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
          { keyName: 'id', condition: 'eq', keyValue: '={{ $("Code - Contexto update").first().json.workflow_execution_id }}' },
          { keyName: 'correlation_id', condition: 'eq', keyValue: '={{ $("Code - Contexto update").first().json.correlation_id }}' },
        ],
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'status', fieldValue: 'completed' },
          {
            fieldId: 'input_payload',
            fieldValue:
              '={{ { automation_id: $("Code - Contexto update").first().json.automation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result } }}',
          },
          { fieldId: 'finished_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [2528, 192],
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
        '={{ ({ accepted: true, workflow_name: "automation_client_controlled_run_stage", correlation_id: $("Code - Contexto update").first().json.correlation_id, automation_id: $("Code - Contexto update").first().json.automation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
      options: { responseCode: 202 },
    },
    position: [2808, 192],
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
              '={{ { automation_id: $json.automation_id, result_summary: $json.result_summary, next_action: $json.next_action, sanitized_result: $json.sanitized_result } }}',
          },
          { fieldId: 'finished_at', fieldValue: '={{ $now.toISO() }}' },
        ],
      },
    },
    position: [2248, 432],
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
        '={{ ({ accepted: false, workflow_name: "automation_client_controlled_run_stage", correlation_id: $("Code - Contexto update").first().json.correlation_id, automation_id: $("Code - Contexto update").first().json.automation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
      options: { responseCode: 422 },
    },
    position: [2528, 432],
  },
});

export default workflow(
  'automation-client-controlled-run-stage-v1',
  'automation_client_controlled_run_stage',
)
  .add(webhookTrigger)
  .to(validatePayload)
  .to(fetchTargetAutomation)
  .to(buildStage)
  .to(insertExecution)
  .to(buildUpdateContext)
  .to(
    checkStage
      .onTrue(updateTargetAutomation.to(updateCompleted).to(respondOk))
      .onFalse(updateError.to(respondError)),
  );
