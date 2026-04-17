"use strict";

const { log } = require("../app/logger");
const { createAutomationEvent } = require("./automation-event.repository");

async function registerBackendEvent({
  eventName,
  clienteId = null,
  correlationId = null,
  eventTimestamp = null,
  dispatchMode = "pending_integration",
  dispatchStatus = "accepted",
  destination = "internal_pending",
  errorMessage = null,
  payload = {},
  status = "accepted",
  source = "backend",
  type = "domain_event",
}) {
  if (typeof eventName !== "string" || !eventName.trim()) {
    throw new Error("eventName es obligatorio para registrar un evento estructurado.");
  }

  const event = {
    id: null,
    provider: "backend_log",
    persisted: false,
    event_type: type,
    event_source: source,
    event_name: eventName.trim(),
    cliente_id: clienteId || null,
    correlation_id: correlationId || null,
    event_timestamp: eventTimestamp || new Date().toISOString(),
    dispatch_mode: dispatchMode,
    dispatch_status: dispatchStatus,
    destination,
    error_message: errorMessage || null,
    payload,
    status,
    received_at: new Date().toISOString(),
    processed_at: null,
  };

  const persistence = await createAutomationEvent({
    event_name: event.event_name,
    cliente_id: event.cliente_id,
    correlation_id: event.correlation_id,
    event_timestamp: event.event_timestamp,
    dispatch_mode: event.dispatch_mode,
    dispatch_status: event.dispatch_status,
    destination: event.destination,
    error_message: event.error_message,
    payload: event.payload,
  });

  if (persistence.persisted && persistence.record) {
    event.id = persistence.record.id;
    event.persisted = true;
    event.provider = persistence.provider;
    event.created_at = persistence.record.created_at || null;
  }

  log("info", "Structured backend event registered", {
    correlationId: event.correlation_id,
    eventName: event.event_name,
    eventSource: event.event_source,
    eventStatus: event.status,
    provider: event.provider,
    persisted: event.persisted,
  });

  return event;
}

module.exports = {
  registerBackendEvent,
};
