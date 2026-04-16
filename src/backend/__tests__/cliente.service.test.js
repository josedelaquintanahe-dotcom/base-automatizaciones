"use strict";

jest.mock("../clients/supabase.client");
jest.mock("../app/logger", () => ({ log: jest.fn() }));

const { createSupabaseClient } = require("../clients/supabase.client");
const {
  activarOnboardingBackofficeService,
  obtenerClienteBackofficeService,
} = require("../services/cliente.service");

function buildSupabaseMock({
  cliente = null,
  credentials = [],
  tokens = [],
  invoices = [],
  clienteError = null,
  credentialsError = null,
  tokensError = null,
  invoicesError = null,
} = {}) {
  const clienteState = cliente ? { ...cliente } : null;

  return {
    from(table) {
      if (table === "clientes") {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: clienteState,
                    error: clienteError,
                  }),
                };
              },
            };
          },
          update(payload) {
            return {
              eq: jest.fn().mockImplementation(() => {
                if (clienteState && payload && typeof payload === "object") {
                  Object.assign(clienteState, payload);
                }

                return Promise.resolve({
                  error: null,
                });
              }),
            };
          },
        };
      }

      if (table === "credenciales_cliente") {
        return {
          select() {
            return {
              eq: jest.fn().mockResolvedValue({
                data: credentials,
                error: credentialsError,
              }),
            };
          },
        };
      }

      if (table === "tokens") {
        return {
          select() {
            return {
              eq() {
                return {
                  order: jest.fn().mockResolvedValue({
                    data: tokens,
                    error: tokensError,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === "facturas") {
        return {
          select() {
            return {
              eq() {
                return {
                  order: jest.fn().mockResolvedValue({
                    data: invoices,
                    error: invoicesError,
                  }),
                };
              },
            };
          },
        };
      }

      throw new Error(`Tabla no mockeada: ${table}`);
    },
  };
}

describe("obtenerClienteBackofficeService", () => {
  test("devuelve detalle operativo y readiness cuando el cliente existe", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: {
          id: "cli_001",
          nombre_empresa: "Empresa Test",
          email_contacto: "ops@test.com",
          telefono: "600000000",
          plan: "profesional",
          estado: "activo",
          fecha_inicio: "2026-04-15",
          precio_mensual: 299,
          created_at: "2026-04-15T10:00:00.000Z",
          updated_at: "2026-04-15T11:00:00.000Z",
        },
        credentials: [
          { tipo: "gmail", nombre: "gmail_email", activo: true },
          { tipo: "api", nombre: "api_token", activo: true },
        ],
        tokens: [{ id: "tok_001", activo: true, expiracion: "2027-04-15" }],
        invoices: [
          {
            mes: "2026-04-15",
            setup_inicial: 800,
            mantenimiento_mensual: 299,
            total: 1099,
            estado: "pendiente",
          },
        ],
      }),
    );

    const result = await obtenerClienteBackofficeService("cli_001");

    expect(result.cliente.id).toBe("cli_001");
    expect(result.operational_summary.onboarding_status).toBe("listo_para_automatizar");
    expect(result.operational_summary.credenciales.activas).toBe(2);
    expect(result.operational_summary.access.token_operativo_activo).toBe(true);
    expect(result.operational_summary.billing.factura_inicial_emitida).toBe(true);
    expect(result.automation_readiness.ready).toBe(true);
    expect(result.automation_readiness.available_context.credenciales_tipos).toEqual([
      "gmail",
      "api",
    ]);
  });

  test("devuelve estado pendiente si faltan credenciales, token y factura", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: {
          id: "cli_002",
          nombre_empresa: "Empresa Vacia",
          email_contacto: "empty@test.com",
          telefono: null,
          plan: "basico",
          estado: "activo",
          fecha_inicio: null,
          precio_mensual: 99,
          created_at: "2026-04-15T10:00:00.000Z",
          updated_at: "2026-04-15T11:00:00.000Z",
        },
      }),
    );

    const result = await obtenerClienteBackofficeService("cli_002");

    expect(result.operational_summary.onboarding_status).toBe("pendiente_configuracion");
    expect(result.automation_readiness.ready).toBe(false);
    expect(result.automation_readiness.missing_requirements.length).toBeGreaterThan(0);
  });

  test("lanza error 400 si falta cliente_id", async () => {
    await expect(obtenerClienteBackofficeService("")).rejects.toMatchObject({
      message: expect.stringMatching(/cliente_id/i),
      statusCode: 400,
    });
  });
});

describe("activarOnboardingBackofficeService", () => {
  test("activa onboarding cuando readiness permite la accion", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: {
          id: "cli_010",
          nombre_empresa: "Empresa Activa",
          email_contacto: "ops@test.com",
          telefono: "600000000",
          plan: "profesional",
          estado: "activo",
          fecha_inicio: null,
          precio_mensual: 299,
          created_at: "2026-04-15T10:00:00.000Z",
          updated_at: "2026-04-15T11:00:00.000Z",
        },
        credentials: [
          { tipo: "gmail", nombre: "gmail_email", activo: true },
        ],
        tokens: [{ id: "tok_001", activo: true, expiracion: "2027-04-15" }],
        invoices: [
          {
            mes: "2026-04-15",
            setup_inicial: 800,
            mantenimiento_mensual: 299,
            total: 1099,
            estado: "pendiente",
          },
        ],
      }),
    );

    const result = await activarOnboardingBackofficeService("cli_010", {
      correlationId: "corr-001",
    });

    expect(result.status).toBe("activated");
    expect(result.detail.operational_summary.activation.status).toBe("activated");
    expect(result.dispatch.mode).toBe("pending_integration");
  });

  test("bloquea la activacion si faltan requisitos", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: {
          id: "cli_011",
          nombre_empresa: "Empresa Bloqueada",
          email_contacto: "ops@test.com",
          telefono: null,
          plan: "basico",
          estado: "activo",
          fecha_inicio: null,
          precio_mensual: 99,
          created_at: "2026-04-15T10:00:00.000Z",
          updated_at: "2026-04-15T11:00:00.000Z",
        },
      }),
    );

    const result = await activarOnboardingBackofficeService("cli_011", {
      correlationId: "corr-002",
    });

    expect(result.status).toBe("blocked");
    expect(result.blocking_reasons.length).toBeGreaterThan(0);
    expect(result.dispatch.mode).toBe("pending_integration");
  });
});
