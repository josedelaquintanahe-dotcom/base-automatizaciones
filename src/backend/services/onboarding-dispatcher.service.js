"use strict";

const { log } = require("../app/logger");
const { getServerConfig } = require("../config/server-config");
const { registerBackendEvent } = require("../repositories/event-log.repository");

const DEFAULT_DISPATCH_TARGET = "internal_pending";
const WEBHOOK_DISPATCH_TARGET = "n8n_webhook";

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

async function dispatchToWebhook({ clienteId, correlationId, event, attemptedAt, activationDate, detail }) {
  try {
    const webhookUrl = getWebhookDispatchUrl();

    if (!webhookUrl) {
      return null;
    }

    const payload = {
      event_name: "onboarding_activated",
      correlation_id: correlationId || null,
      cliente_id: clienteId,
      timestamp: attemptedAt,
      onboarding_status: detail.operational_summary?.onboarding_status || null,
      activation_date: activationDate,
      source: "backoffice_activation",
      event,
    };
    const webhookTarget = getSafeWebhookTarget(webhookUrl);

    log("info", "Onboarding webhook dispatch started", {
      correlationId,
      clienteId,
      webhookTarget,
      eventName: payload.event_name,
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
      clienteId,
      webhookTarget,
      eventName: payload.event_name,
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
      clienteId,
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

  const event = await registerBackendEvent({
    eventName: "onboarding_activated",
    correlationId,
    payload: eventPayload,
    status: "accepted",
  });

  const webhookDispatch = await dispatchToWebhook({
    clienteId: cliente.id,
    correlationId,
    event,
    attemptedAt,
    activationDate,
    detail,
  });
  const dispatch =
    webhookDispatch ||
    (await dispatchToInternalPending({
      clienteId: cliente.id,
      correlationId,
      event,
    }));

  return {
    event,
    dispatch,
  };
}

module.exports = {
  dispatchOnboardingActivated,
};
