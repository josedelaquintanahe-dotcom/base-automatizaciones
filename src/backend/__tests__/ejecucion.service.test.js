"use strict";

jest.mock("../clients/supabase.client");
jest.mock("../clients/n8n.client");
jest.mock("../services/cliente.service");
jest.mock("../app/logger", () => ({ log: jest.fn() }));

const { createSupabaseClient } = require("../clients/supabase.client");
const { triggerN8nWebhookPath } = require("../clients/n8n.client");
const { obtenerClienteBackofficeService } = require("../services/cliente.service");
const { ejecutarWorkflowService } = require("../services/ejecucion.service");

function buildSupabaseMock({ automatizacion }) {
  return {
    from(table) {
      if (table === "automatizaciones") {
        return {
          select() {
            return {
              eq() {
                return {
                  or() {
                    return {
                      limit() {
                        return {
                          maybeSingle: jest.fn().mockResolvedValue({
                            data: automatizacion,
                            error: null,
                          }),
                        };
                      },
                    };
                  },
                };
              },
            };
          },
          update() {
            return {
              eq: jest.fn().mockResolvedValue({
                error: null,
              }),
            };
          },
        };
      }

      if (table === "ejecuciones") {
        return {
          insert() {
            return {
              select() {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: "exec_001",
                      estado: "exito",
                    },
                    error: null,
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

describe("ejecutarWorkflowService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("usa n8n_workflow_id real y envia payload sanitario", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        automatizacion: {
          id: "auto_001",
          cliente_id: "cli_001",
          nombre: "Snapshot sanitario del cliente",
          n8n_workflow_id: "automation_client_health_snapshot",
          estado: "activo",
        },
      }),
    );
    obtenerClienteBackofficeService.mockResolvedValue({
      cliente: {
        id: "cli_001",
        nombre_empresa: "Empresa Test",
        plan: "profesional",
        estado: "activo",
      },
      operational_summary: {
        onboarding_status: "listo_para_automatizar",
      },
      automation_readiness: {
        ready: true,
        missing_requirements: [],
        next_recommended_action: "Ejecutar automatizacion base.",
      },
    });
    triggerN8nWebhookPath.mockResolvedValue({
      ok: true,
      status: 202,
      data: {
        accepted: true,
        workflow_name: "automation_client_health_snapshot",
      },
    });

    const result = await ejecutarWorkflowService(
      "cli_001",
      "automation_client_health_snapshot",
      { scope: "manual" },
      {
        correlationId: "corr-001",
        triggerSource: "backoffice_internal",
      },
    );

    expect(triggerN8nWebhookPath).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "automation_client_health_snapshot",
        payload: expect.objectContaining({
          correlation_id: "corr-001",
          cliente_id: "cli_001",
          automation_id: "auto_001",
          workflow_name: "automation_client_health_snapshot",
          trigger_source: "backoffice_internal",
          request_payload: {
            scope: "manual",
          },
          client_snapshot: expect.objectContaining({
            cliente: expect.objectContaining({
              id: "cli_001",
              nombre_empresa: "Empresa Test",
            }),
          }),
        }),
      }),
    );
    expect(triggerN8nWebhookPath.mock.calls[0][0].payload.credenciales).toBeUndefined();
    expect(result.correlation_id).toBe("corr-001");
    expect(result.workflow_target).toBe("automation_client_health_snapshot");
  });

  test("bloquea la ejecucion si la automatizacion no esta activa", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        automatizacion: {
          id: "auto_002",
          cliente_id: "cli_002",
          nombre: "Snapshot sanitario del cliente",
          n8n_workflow_id: "automation_client_health_snapshot",
          estado: "pausado",
        },
      }),
    );
    obtenerClienteBackofficeService.mockResolvedValue({
      cliente: { id: "cli_002", nombre_empresa: "Empresa Test", plan: "basico", estado: "activo" },
      operational_summary: {},
      automation_readiness: {
        ready: true,
        missing_requirements: [],
        next_recommended_action: null,
      },
    });

    await expect(
      ejecutarWorkflowService("cli_002", "automation_client_health_snapshot", {}, {
        correlationId: "corr-002",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(triggerN8nWebhookPath).not.toHaveBeenCalled();
  });
});
