"use strict";

const { log } = require("../app/logger");

async function registerBackendEvent({
  eventName,
  correlationId = null,
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
    correlation_id: correlationId || null,
    payload,
    status,
    received_at: new Date().toISOString(),
    processed_at: null,
  };

  log("info", "Structured backend event registered", {
    correlationId: event.correlation_id,
    eventName: event.event_name,
    eventSource: event.event_source,
    eventStatus: event.status,
    provider: event.provider,
  });

  return event;
}

module.exports = {
  registerBackendEvent,
};
