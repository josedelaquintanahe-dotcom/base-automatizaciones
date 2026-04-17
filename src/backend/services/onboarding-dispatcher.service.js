"use strict";

const { log } = require("../app/logger");
const { registerBackendEvent } = require("../repositories/event-log.repository");

const DEFAULT_DISPATCH_TARGET = "internal_pending";

function buildOnboardingActivatedEventPayload({ cliente, detail, attemptedAt, activationDate }) {
  return {
    trigger: "backoffice_activation",
    attempted_at: attemptedAt,
    activation_date: activationDate,
    cliente: {
      id: cliente.id,
      nombre_empresa: cliente.nombre_empresa,
      email_contacto: cliente.email_contacto,
      plan: cliente.plan,
      estado: cliente.estado || null,
      fecha_inicio: cliente.fecha_inicio || null,
    },
    automation_readiness: detail.automation_readiness,
    operational_summary: {
      onboarding_status: detail.operational_summary?.onboarding_status || null,
      activation: detail.operational_summary?.activation || null,
      credenciales: {
        activas: detail.operational_summary?.credenciales?.activas ?? 0,
        tipos_configurados: detail.operational_summary?.credenciales?.tipos_configurados || [],
      },
      access: {
        token_operativo_activo:
          detail.operational_summary?.access?.token_operativo_activo || false,
      },
      billing: {
        factura_inicial_emitida:
          detail.operational_summary?.billing?.factura_inicial_emitida || false,
      },
    },
  };
}

async function dispatchToInternalPending({ clienteId, correlationId, event }) {
  log("info", "Onboarding dispatch accepted by internal dispatcher", {
    correlationId,
    clienteId,
    destination: DEFAULT_DISPATCH_TARGET,
    eventName: event.event_name,
  });

  return {
    mode: "pending_integration",
    automated: false,
    target: "automatizacion_onboarding",
    next_step: "Conectar este punto con el dispatcher real en n8n o backend.",
    destination: DEFAULT_DISPATCH_TARGET,
    delivery_status: "accepted",
  };
}

const DISPATCH_HANDLERS = {
  [DEFAULT_DISPATCH_TARGET]: dispatchToInternalPending,
};

function resolveDispatchHandler(target = DEFAULT_DISPATCH_TARGET) {
  return DISPATCH_HANDLERS[target] || DISPATCH_HANDLERS[DEFAULT_DISPATCH_TARGET];
}

async function dispatchOnboardingActivated({ cliente, detail, attemptedAt, activationDate, context = {} }) {
  if (!cliente || !cliente.id) {
    throw new Error("cliente es obligatorio para ejecutar el dispatcher de onboarding.");
  }

  const event = await registerBackendEvent({
    eventName: "onboarding_activated",
    correlationId: context.correlationId || null,
    payload: buildOnboardingActivatedEventPayload({
      cliente,
      detail,
      attemptedAt,
      activationDate,
    }),
    status: "accepted",
  });

  const dispatchHandler = resolveDispatchHandler(DEFAULT_DISPATCH_TARGET);
  const dispatch = await dispatchHandler({
    clienteId: cliente.id,
    correlationId: context.correlationId || null,
    event,
  });

  return {
    event,
    dispatch,
  };
}

module.exports = {
  dispatchOnboardingActivated,
};
