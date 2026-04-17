"use strict";

jest.mock("../app/logger", () => ({ log: jest.fn() }));
jest.mock("../repositories/event-log.repository", () => ({
  registerBackendEvent: jest.fn(),
}));

const { registerBackendEvent } = require("../repositories/event-log.repository");
const { dispatchOnboardingActivated } = require("../services/onboarding-dispatcher.service");

describe("dispatchOnboardingActivated", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registra el evento onboarding_activated y devuelve el dispatch publico esperado", async () => {
    registerBackendEvent.mockResolvedValue({
      event_name: "onboarding_activated",
      correlation_id: "corr-100",
      provider: "backend_log",
      persisted: false,
    });

    const result = await dispatchOnboardingActivated({
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
    });

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
  });
});
