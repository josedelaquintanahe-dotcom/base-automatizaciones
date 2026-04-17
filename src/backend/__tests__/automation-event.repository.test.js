"use strict";

jest.mock("../app/logger", () => ({ log: jest.fn() }));
jest.mock("../clients/supabase.client", () => ({
  createSupabaseClient: jest.fn(),
  validateSupabaseClientConfig: jest.fn(),
}));

const {
  createSupabaseClient,
  validateSupabaseClientConfig,
} = require("../clients/supabase.client");
const {
  createAutomationEvent,
  getAutomationEventsRepositoryStatus,
} = require("../repositories/automation-event.repository");

describe("automation-event.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("devuelve estado config_incomplete si falta configuracion de Supabase", () => {
    validateSupabaseClientConfig.mockReturnValue({
      isValid: false,
      missing: ["SUPABASE_SERVICE_ROLE_KEY"],
      errors: [],
    });

    const status = getAutomationEventsRepositoryStatus();

    expect(status.status).toBe("config_incomplete");
    expect(status.missingVariables).toEqual(["SUPABASE_SERVICE_ROLE_KEY"]);
  });

  test("omite la persistencia si la configuracion de Supabase es incompleta", async () => {
    validateSupabaseClientConfig.mockReturnValue({
      isValid: false,
      missing: ["SUPABASE_SERVICE_ROLE_KEY"],
      errors: [],
    });

    const result = await createAutomationEvent({
      event_name: "onboarding_activated",
      cliente_id: "cli_001",
      correlation_id: "corr-001",
      event_timestamp: "2026-04-17T12:00:00.000Z",
      dispatch_mode: "webhook",
      dispatch_status: "accepted",
      destination: "n8n_webhook",
      error_message: null,
      payload: { ok: true },
    });

    expect(result).toMatchObject({
      persisted: false,
      skipped: true,
      reason: "supabase_config_incomplete",
    });
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  test("persiste el evento cuando Supabase esta disponible", async () => {
    validateSupabaseClientConfig.mockReturnValue({
      isValid: true,
      missing: [],
      errors: [],
    });

    const single = jest.fn().mockResolvedValue({
      data: {
        id: "evt_001",
        event_name: "onboarding_activated",
        cliente_id: "cli_001",
        correlation_id: "corr-001",
        event_timestamp: "2026-04-17T12:00:00.000Z",
        dispatch_mode: "webhook",
        dispatch_status: "accepted",
        destination: "n8n_webhook",
        error_message: null,
        payload: { ok: true },
        created_at: "2026-04-17T12:00:01.000Z",
      },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    createSupabaseClient.mockReturnValue({
      from: jest.fn().mockReturnValue({ insert }),
    });

    const result = await createAutomationEvent({
      event_name: "onboarding_activated",
      cliente_id: "cli_001",
      correlation_id: "corr-001",
      event_timestamp: "2026-04-17T12:00:00.000Z",
      dispatch_mode: "webhook",
      dispatch_status: "accepted",
      destination: "n8n_webhook",
      error_message: null,
      payload: { ok: true },
    });

    expect(result.persisted).toBe(true);
    expect(result.record.id).toBe("evt_001");
  });
});
