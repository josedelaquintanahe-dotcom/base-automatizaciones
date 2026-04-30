import { workflow, node, trigger, ifElse, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook - automation_client_first_run_handoff',
    parameters: {
      httpMethod: 'POST',
      path: 'automation_client_first_run_handoff',
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
      automation_id: payload.automation_id ?? null,
    }
  }
];
      `,
    },
    position: [520, 300],
  },
});

const buildHandoff = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code - Preparar handoff',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const source = $input.first().json;
const payload = source.payload ?? {};
const clientSnapshot = payload.client_snapshot ?? {};
const operationalSummary = clientSnapshot.operational_summary ?? {};
const automationReadiness = clientSnapshot.automation_readiness ?? {};
const requestedScope = payload.request_payload?.scope ?? null;
const candidateAutomation = payload.request_payload?.candidate_automation ?? 'pendiente_definir';
const requestedRunWindow = payload.request_payload?.run_window ?? 'manual_controlled';

const preflightChecklist = [];
const rollbackNotes = [];
const operatorNotes = [];
const ready = Boolean(source.valid && automationReadiness.ready);
const missingRequirements = Array.isArray(automationReadiness.missing_requirements)
  ? automationReadiness.missing_requirements
  : [];

preflightChecklist.push('Verificar que el cliente mantiene onboarding_status listo_para_automatizar');
preflightChecklist.push('Confirmar token operativo activo y credenciales activas antes del primer arranque');
preflightChecklist.push('Ejecutar la automatizacion primero en modo manual controlado con correlation_id trazable');

if (requestedRunWindow !== 'manual_controlled') {
  preflightChecklist.push('Revisar que la ventana solicitada sea compatible con supervision humana');
}

rollbackNotes.push('Pausar la automatizacion objetivo si el primer arranque devuelve error no controlado');
rollbackNotes.push('Conservar correlation_id y resultado tecnico para soporte y trazabilidad');
rollbackNotes.push('No continuar con automatizaciones externas hasta cerrar las incidencias detectadas');

if (ready) {
  operatorNotes.push('El cliente supera readiness y puede pasar a una primera automatizacion con efecto controlado');
  operatorNotes.push('Usar este handoff como paquete de preflight y rollback para la siguiente ejecucion real');
} else {
  for (const requirement of missingRequirements) {
    operatorNotes.push('Bloqueo previo a primer arranque: ' + requirement);
  }
  operatorNotes.push(
    automationReadiness.next_recommended_action ?? 'Resolver requisitos pendientes antes del primer arranque'
  );
}

return [
  {
    json: {
      correlation_id: source.correlation_id,
      cliente_id: source.cliente_id,
      automation_id: source.automation_id,
      final_status: source.valid ? 'completed' : 'error',
      result_summary: source.valid
        ? (ready
            ? 'Handoff operativo preparado para la primera ejecucion real controlada'
            : 'Handoff operativo preparado con bloqueos previos al primer arranque')
        : 'No se pudo preparar el handoff operativo por payload incompleto',
      next_action: source.valid
        ? (ready
            ? 'Seleccionar la siguiente automatizacion con efecto controlado y usar este handoff'
            : (automationReadiness.next_recommended_action ?? 'Resolver bloqueos antes del primer arranque'))
        : 'Revisar el contrato del payload antes de reintentar',
      sanitized_result: {
        handoff_status: ready ? 'ready_for_first_run' : 'blocked_before_first_run',
        go_live_ready: ready,
        candidate_automation: candidateAutomation,
        run_window: requestedRunWindow,
        preflight_checklist: preflightChecklist,
        rollback_notes: rollbackNotes,
        operator_handoff_notes: operatorNotes,
        blocking_requirements_count: missingRequirements.length,
        requested_scope: requestedScope
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
          { fieldId: 'workflow_name', fieldValue: 'automation_client_first_run_handoff' },
          { fieldId: 'execution_source', fieldValue: 'n8n_webhook' },
          { fieldId: 'correlation_id', fieldValue: '={{ $json.correlation_id }}' },
          { fieldId: 'cliente_id', fieldValue: '={{ $json.cliente_id }}' },
          { fieldId: 'status', fieldValue: 'received' },
          { fieldId: 'input_payload', fieldValue: '={{ $json }}' },
          { fieldId: 'started_at', fieldValue: '={{ $now.toISO() }}' },
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
const handoff = $('Code - Preparar handoff').first().json;

return [
  {
    json: {
      workflow_execution_id: execution.id ?? null,
      automation_id: handoff.automation_id,
      correlation_id: handoff.correlation_id,
      cliente_id: handoff.cliente_id,
      final_status: handoff.final_status,
      result_summary: handoff.result_summary,
      next_action: handoff.next_action,
      sanitized_result: handoff.sanitized_result
    }
  }
];
      `,
    },
    position: [1408, 300],
  },
});

const checkHandoff = ifElse({
  version: 2.3,
  config: {
    name: 'IF - Handoff ready',
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
              '={{ { automation_id: $json.automation_id, result_summary: $json.result_summary, next_action: $json.next_action, sanitized_result: $json.sanitized_result } }}',
          },
          { fieldId: 'finished_at', fieldValue: '={{ $now.toISO() }}' },
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
        '={{ ({ accepted: true, workflow_name: "automation_client_first_run_handoff", correlation_id: $("Code - Contexto update").first().json.correlation_id, automation_id: $("Code - Contexto update").first().json.automation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
      options: { responseCode: 202 },
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
        '={{ ({ accepted: false, workflow_name: "automation_client_first_run_handoff", correlation_id: $("Code - Contexto update").first().json.correlation_id, automation_id: $("Code - Contexto update").first().json.automation_id, result_summary: $("Code - Contexto update").first().json.result_summary, next_action: $("Code - Contexto update").first().json.next_action, sanitized_result: $("Code - Contexto update").first().json.sanitized_result }) }}',
      options: { responseCode: 422 },
    },
    position: [2248, 432],
  },
});

export default workflow(
  'automation-client-first-run-handoff-v1',
  'automation_client_first_run_handoff',
)
  .add(webhookTrigger)
  .to(validatePayload)
  .to(buildHandoff)
  .to(insertExecution)
  .to(buildUpdateContext)
  .to(
    checkHandoff
      .onTrue(updateCompleted.to(respondOk))
      .onFalse(updateError.to(respondError)),
  );
