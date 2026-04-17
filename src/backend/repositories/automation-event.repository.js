"use strict";

const { log } = require("../app/logger");
const { createSupabaseClient, validateSupabaseClientConfig } = require("../clients/supabase.client");

function getAutomationEventsRepositoryStatus() {
  const validation = validateSupabaseClientConfig({ keyType: "service_role" });

  return {
    repository: "automation_events",
    provider: "supabase",
    status: validation.isValid ? "ready_for_writes" : "config_incomplete",
    missingVariables: validation.missing,
    validationErrors: validation.errors,
    note: "Persistencia best effort para trazabilidad de eventos de automatizacion.",
  };
}

async function createAutomationEvent(record) {
  const validation = validateSupabaseClientConfig({ keyType: "service_role" });

  if (!validation.isValid) {
    log("warn", "Automation event persistence skipped", {
      reason: "supabase_config_incomplete",
      missingVariables: validation.missing,
      validationErrors: validation.errors,
      eventName: record?.event_name || null,
      correlationId: record?.correlation_id || null,
    });

    return {
      persisted: false,
      provider: "supabase",
      skipped: true,
      reason: "supabase_config_incomplete",
      record: null,
    };
  }

  try {
    const supabase = createSupabaseClient({ keyType: "service_role" });
    const { data, error } = await supabase
      .from("automation_events")
      .insert(record)
      .select(
        "id, event_name, cliente_id, correlation_id, event_timestamp, dispatch_mode, dispatch_status, destination, error_message, payload, created_at",
      )
      .single();

    if (error) {
      throw error;
    }

    return {
      persisted: true,
      provider: "supabase",
      skipped: false,
      reason: null,
      record: data,
    };
  } catch (error) {
    log("error", "Automation event persistence failed", {
      eventName: record?.event_name || null,
      correlationId: record?.correlation_id || null,
      error: error && error.message ? error.message : "unknown_error",
    });

    return {
      persisted: false,
      provider: "supabase",
      skipped: false,
      reason: error && error.message ? error.message : "unknown_error",
      record: null,
    };
  }
}

module.exports = {
  createAutomationEvent,
  getAutomationEventsRepositoryStatus,
};
