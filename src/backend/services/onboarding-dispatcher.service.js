"use strict";

const { log } = require("../app/logger");
const { getServerConfig } = require("../config/server-config");
const { registerBackendEvent } = require("../repositories/event-log.repository");

const DEFAULT_DISPATCH_TARGET = "internal_pending";
const WEBHOOK_DISPATCH_TARGET = "n8n_webhook";
const ONBOARDING_WEBHOOK_VERSION = "v1";

function buildOnboardingActivatedEventPayload({ cliente, detail, attemptedAt, activationDate }) {
  return {
    trigger: "backoffice_activation",
    event_name: "onboarding_activated",
    timestamp: attemptedAt,
    correlation_id: detail?.operational_summary?.activation?.correlation_id || null,
    cliente_id: cliente.id,
    onboarding_status: detail.operational_summary?.onboarding_status || null,
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

function buildOnboardingWebhookPayload({ cliente, detail, attemptedAt, activationDate, correlationId }) {
  return {
    event_name: "onboarding_activated",
    version: ONBOARDING_WEBHOOK_VERSION,
    correlation_id: correlationId || null,
    cliente_id: cliente.id,
    timestamp: attemptedAt,
    source: "backoffice_activation",
    onboarding_status: detail.operational_summary?.onboarding_status || null,
    activation_date: activationDate,
    client_summary: {
      id: cliente.id,
      nombre_empresa: cliente.nombre_empresa,
      email_contacto: cliente.email_contacto,
      plan: cliente.plan,
      estado: cliente.estado || null,
      fecha_inicio: cliente.fecha_inicio || null,
    },
    automation_readiness: {
      ready: Boolean(detail.automation_readiness?.ready),
      missing_requirements: detail.automation_readiness?.missing_requirements || [],
      next_recommended_action: detail.automation_readiness?.next_recommended_action || null,
    },
    operational_summary: {
      credenciales_activas: detail.operational_summary?.credenciales?.activas ?? 0,
      tipos_credencial: detail.operational_summary?.credenciales?.tipos_configurados || [],
      token_operativo_activo: detail.operational_summary?.access?.token_operativo_activo || false,
      factura_inicial_emitida:
        detail.operational_summary?.billing?.factura_inicial_emitida || false,
    },
  };
}

function getWebhookDispatchUrl() {
  return getServerConfig().onboardingDispatchWebhookUrl;
}

function getSafeWebhookTarget(webhookUrl) {
  try {
    const parsedUrl = new URL(webhookUrl);
    return `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch (error) {
    return "invalid_webhook_url";
  }
}

function buildTransientEvent({
  eventName,
  clienteId,
  correlationId,
  eventTimestamp,
  payload,
}) {
  return {
    id: null,
    provider: "backend_log",
    persisted: false,
    event_type: "domain_event",
    event_source: "backend",
    event_name: eventName,
    cliente_id: clienteId,
    correlation_id: correlationId || null,
    event_timestamp: eventTimestamp,
    payload,
  };
}

async function dispatchToWebhook({ cliente, correlationId, event, attemptedAt, activationDate, detail }) {
  try {
    const webhookUrl = getWebhookDispatchUrl();

    if (!webhookUrl) {
      return null;
    }

    const payload = buildOnboardingWebhookPayload({
      cliente,
      detail,
      attemptedAt,
      activationDate,
      correlationId,
    });
    const webhookTarget = getSafeWebhookTarget(webhookUrl);

    log("info", "Onboarding webhook dispatch started", {
      correlationId,
      clienteId: cliente.id,
      webhookTarget,
      eventName: payload.event_name,
      eventVersion: payload.version,
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId || "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook respondio con HTTP ${response.status}.`);
    }

    log("info", "Onboarding webhook dispatch completed", {
      correlationId,
      clienteId: cliente.id,
      webhookTarget,
      eventName: payload.event_name,
      eventVersion: payload.version,
      statusCode: response.status,
    });

    return {
      mode: "webhook",
      automated: true,
      target: "automatizacion_onboarding",
      next_step: "Webhook de onboarding enviado correctamente al destino configurado.",
      destination: WEBHOOK_DISPATCH_TARGET,
      delivery_status: "accepted",
      webhook_target: webhookTarget,
    };
  } catch (error) {
    const webhookTarget =
      typeof process.env.ONBOARDING_DISPATCH_WEBHOOK_URL === "string" &&
      process.env.ONBOARDING_DISPATCH_WEBHOOK_URL.trim()
        ? getSafeWebhookTarget(process.env.ONBOARDING_DISPATCH_WEBHOOK_URL.trim())
        : "not_configured";

    log("error", "Onboarding webhook dispatch failed", {
      correlationId,
      clienteId: cliente && cliente.id ? cliente.id : null,
      webhookTarget,
      eventName: "onboarding_activated",
      error: error && error.message ? error.message : "unknown_error",
    });

    return {
      mode: "pending_integration",
      automated: false,
      target: "automatizacion_onboarding",
      next_step: "El webhook de onboarding fallo. Revisar logs y reintentar integracion.",
      destination: WEBHOOK_DISPATCH_TARGET,
      delivery_status: "failed",
      webhook_target: webhookTarget,
    };
  }
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

async function dispatchOnboardingActivated({ cliente, detail, attemptedAt, activationDate, context = {} }) {
  if (!cliente || !cliente.id) {
    throw new Error("cliente es obligatorio para ejecutar el dispatcher de onboarding.");
  }

  const correlationId =
    context.correlationId || detail?.operational_summary?.activation?.correlation_id || null;
  const eventPayload = buildOnboardingActivatedEventPayload({
    cliente,
    detail,
    attemptedAt,
    activationDate,
  });
  eventPayload.correlation_id = correlationId;
  const transientEvent = buildTransientEvent({
    eventName: "onboarding_activated",
    clienteId: cliente.id,
    correlationId,
    eventTimestamp: attemptedAt,
    payload: eventPayload,
  });

  const webhookDispatch = await dispatchToWebhook({
    cliente,
    correlationId,
    event: transientEvent,
    attemptedAt,
    activationDate,
    detail,
  });
  const dispatch =
    webhookDispatch ||
    (await dispatchToInternalPending({
      clienteId: cliente.id,
      correlationId,
      event: transientEvent,
    }));
  const event = await registerBackendEvent({
    eventName: transientEvent.event_name,
    clienteId: transientEvent.cliente_id,
    correlationId,
    eventTimestamp: transientEvent.event_timestamp,
    dispatchMode: dispatch.mode,
    dispatchStatus: dispatch.delivery_status,
    destination: dispatch.destination,
    errorMessage: dispatch.delivery_status === "failed" ? dispatch.next_step : null,
    payload: transientEvent.payload,
    status: "accepted",
  });

  return {
    event,
    dispatch,
  };
}

module.exports = {
  dispatchOnboardingActivated,
};
