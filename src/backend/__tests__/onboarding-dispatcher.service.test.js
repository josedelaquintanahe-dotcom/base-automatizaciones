"use strict";

jest.mock("../app/logger", () => ({ log: jest.fn() }));
jest.mock("../repositories/event-log.repository", () => ({
  registerBackendEvent: jest.fn(),
}));

const { registerBackendEvent } = require("../repositories/event-log.repository");
const { dispatchOnboardingActivated } = require("../services/onboarding-dispatcher.service");

describe("dispatchOnboardingActivated", () => {
  const originalFetch = global.fetch;
  const originalWebhookUrl = process.env.ONBOARDING_DISPATCH_WEBHOOK_URL;

  function buildDispatchInput() {
    return {
      cliente: {
        id: "cli_100",
        nombre_empresa: "Empresa Test",
        email_contacto: "ops@test.com",
        plan: "profesional",
        estado: "activo",
        fecha_inicio: "2026-04-17",
      },
      detail: {
        operational_summary: {
          onboarding_status: "listo_para_automatizar",
          activation: {
            status: "activated",
            can_activate: false,
            blocking_reasons: [],
            operator_message: "Onboarding activado. Pendiente de conectar la automatizacion real.",
          },
          credenciales: {
            activas: 2,
            tipos_configurados: ["gmail", "api"],
          },
          access: {
            token_operativo_activo: true,
          },
          billing: {
            factura_inicial_emitida: true,
          },
        },
        automation_readiness: {
          ready: true,
          missing_requirements: [],
          next_recommended_action: "Onboarding activado. Pendiente de conectar el dispatcher real.",
        },
      },
      attemptedAt: "2026-04-17T10:00:00.000Z",
      activationDate: "2026-04-17",
      context: {
        correlationId: "corr-100",
      },
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ONBOARDING_DISPATCH_WEBHOOK_URL;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;

    if (originalWebhookUrl === undefined) {
      delete process.env.ONBOARDING_DISPATCH_WEBHOOK_URL;
    } else {
      process.env.ONBOARDING_DISPATCH_WEBHOOK_URL = originalWebhookUrl;
    }
  });

  test("usa fallback interno si no hay webhook configurado", async () => {
    registerBackendEvent.mockResolvedValue({
      event_name: "onboarding_activated",
      correlation_id: "corr-100",
      provider: "backend_log",
      persisted: false,
    });

    const result = await dispatchOnboardingActivated(buildDispatchInput());

    expect(registerBackendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "onboarding_activated",
        correlationId: "corr-100",
        status: "accepted",
      }),
    );
    expect(result.event.event_name).toBe("onboarding_activated");
    expect(result.dispatch).toMatchObject({
      mode: "pending_integration",
      automated: false,
      target: "automatizacion_onboarding",
      destination: "internal_pending",
      delivery_status: "accepted",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("envia webhook si ONBOARDING_DISPATCH_WEBHOOK_URL esta configurada", async () => {
    process.env.ONBOARDING_DISPATCH_WEBHOOK_URL = "https://n8n.example.com/webhook/onboarding";
    global.fetch.mockResolvedValue({
      ok: true,
      status: 202,
    });
    registerBackendEvent.mockResolvedValue({
      event_name: "onboarding_activated",
      correlation_id: "corr-100",
      provider: "backend_log",
      persisted: false,
    });

    const result = await dispatchOnboardingActivated(buildDispatchInput());

    expect(global.fetch).toHaveBeenCalledWith(
      "https://n8n.example.com/webhook/onboarding",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "content-type": "application/json",
          "x-correlation-id": "corr-100",
        }),
      }),
    );
    const [, fetchOptions] = global.fetch.mock.calls[0];
    const payload = JSON.parse(fetchOptions.body);
    expect(payload).toMatchObject({
      event_name: "onboarding_activated",
      correlation_id: "corr-100",
      cliente_id: "cli_100",
      timestamp: "2026-04-17T10:00:00.000Z",
      onboarding_status: "listo_para_automatizar",
    });
    expect(result.dispatch).toMatchObject({
      mode: "webhook",
      automated: true,
      target: "automatizacion_onboarding",
      destination: "n8n_webhook",
      delivery_status: "accepted",
    });
  });

  test("si el webhook falla no rompe el dispatcher y devuelve estado de entrega fallido", async () => {
    process.env.ONBOARDING_DISPATCH_WEBHOOK_URL = "https://n8n.example.com/webhook/onboarding";
    global.fetch.mockRejectedValue(new Error("network_error"));
    registerBackendEvent.mockResolvedValue({
      event_name: "onboarding_activated",
      correlation_id: "corr-100",
      provider: "backend_log",
      persisted: false,
    });

    const result = await dispatchOnboardingActivated(buildDispatchInput());

    expect(result.dispatch).toMatchObject({
      mode: "pending_integration",
      automated: false,
      target: "automatizacion_onboarding",
      destination: "n8n_webhook",
      delivery_status: "failed",
    });
  });
});
