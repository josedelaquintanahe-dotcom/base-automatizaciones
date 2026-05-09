"use strict";

jest.mock("../clients/supabase.client");
jest.mock("../app/logger", () => ({ log: jest.fn() }));

const { createSupabaseClient } = require("../clients/supabase.client");
const {
  provisionarAutomatizacionBaseService,
} = require("../services/automatizacion.service");

function buildSupabaseMock({ cliente = null, existingAutomation = null, insertedAutomation = null } = {}) {
  return {
    from(table) {
      if (table === "clientes") {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: cliente,
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === "automatizaciones") {
        return {
          select() {
            return {
              eq(field, value) {
                if (field === "cliente_id") {
                  return {
                    eq() {
                      return {
                        maybeSingle: jest.fn().mockResolvedValue({
                          data: existingAutomation,
                          error: null,
                        }),
                      };
                    },
                  };
                }

                throw new Error(`Campo no mockeado en select automatizaciones: ${field}=${value}`);
              },
            };
          },
          insert() {
            return {
              select() {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: insertedAutomation,
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

describe("provisionarAutomatizacionBaseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("crea la automatizacion base si no existe", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: { id: "cli_001" },
        insertedAutomation: {
          id: "auto_001",
          cliente_id: "cli_001",
          nombre: "Snapshot sanitario del cliente",
          descripcion: "desc",
          n8n_workflow_id: "automation_client_health_snapshot",
          estado: "activo",
          frecuencia: "manual",
        },
      }),
    );

    const result = await provisionarAutomatizacionBaseService("cli_001");

    expect(result.created).toBe(true);
    expect(result.template_key).toBe("client_health_snapshot");
    expect(result.automatizacion.n8n_workflow_id).toBe("automation_client_health_snapshot");
  });

  test("devuelve la automatizacion existente si ya fue provisionada", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: { id: "cli_002" },
        existingAutomation: {
          id: "auto_002",
          cliente_id: "cli_002",
          nombre: "Snapshot sanitario del cliente",
          descripcion: "desc",
          n8n_workflow_id: "automation_client_health_snapshot",
          estado: "activo",
          frecuencia: "manual",
        },
      }),
    );

    const result = await provisionarAutomatizacionBaseService("cli_002");

    expect(result.created).toBe(false);
    expect(result.automatizacion.id).toBe("auto_002");
  });

  test("permite provisionar una segunda automatizacion base por template explicito", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: { id: "cli_003" },
        insertedAutomation: {
          id: "auto_003",
          cliente_id: "cli_003",
          nombre: "Brief operativo de siguientes pasos",
          descripcion: "desc",
          n8n_workflow_id: "automation_client_next_actions_brief",
          estado: "activo",
          frecuencia: "manual",
        },
      }),
    );

    const result = await provisionarAutomatizacionBaseService(
      "cli_003",
      "client_next_actions_brief",
    );

    expect(result.created).toBe(true);
    expect(result.template_key).toBe("client_next_actions_brief");
    expect(result.automatizacion.n8n_workflow_id).toBe(
      "automation_client_next_actions_brief",
    );
  });

  test("permite provisionar el handoff operativo de primer arranque por template explicito", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: { id: "cli_004" },
        insertedAutomation: {
          id: "auto_004",
          cliente_id: "cli_004",
          nombre: "Handoff operativo de primer arranque",
          descripcion: "desc",
          n8n_workflow_id: "automation_client_first_run_handoff",
          estado: "activo",
          frecuencia: "manual",
        },
      }),
    );

    const result = await provisionarAutomatizacionBaseService(
      "cli_004",
      "client_first_run_handoff",
    );

    expect(result.created).toBe(true);
    expect(result.template_key).toBe("client_first_run_handoff");
    expect(result.automatizacion.n8n_workflow_id).toBe(
      "automation_client_first_run_handoff",
    );
  });

  test("permite provisionar el staging de ejecucion controlada por template explicito", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: { id: "cli_005" },
        insertedAutomation: {
          id: "auto_005",
          cliente_id: "cli_005",
          nombre: "Staging de ejecucion controlada",
          descripcion: "desc",
          n8n_workflow_id: "automation_client_controlled_run_stage",
          estado: "activo",
          frecuencia: "manual",
        },
      }),
    );

    const result = await provisionarAutomatizacionBaseService(
      "cli_005",
      "client_controlled_run_stage",
    );

    expect(result.created).toBe(true);
    expect(result.template_key).toBe("client_controlled_run_stage");
    expect(result.automatizacion.n8n_workflow_id).toBe(
      "automation_client_controlled_run_stage",
    );
  });

  test("permite provisionar la creacion de borrador de factura por template explicito", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: { id: "cli_006" },
        insertedAutomation: {
          id: "auto_006",
          cliente_id: "cli_006",
          nombre: "Creacion de borrador de factura mensual",
          descripcion: "desc",
          n8n_workflow_id: "automation_client_invoice_draft_create",
          estado: "activo",
          frecuencia: "manual",
        },
      }),
    );

    const result = await provisionarAutomatizacionBaseService(
      "cli_006",
      "client_invoice_draft_create",
    );

    expect(result.created).toBe(true);
    expect(result.template_key).toBe("client_invoice_draft_create");
    expect(result.automatizacion.n8n_workflow_id).toBe(
      "automation_client_invoice_draft_create",
    );
  });

  test("permite provisionar el marcado reversible de factura pagada por template explicito", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: { id: "cli_007" },
        insertedAutomation: {
          id: "auto_007",
          cliente_id: "cli_007",
          nombre: "Marcado reversible de factura pagada",
          descripcion: "desc",
          n8n_workflow_id: "automation_client_invoice_mark_paid",
          estado: "activo",
          frecuencia: "manual",
        },
      }),
    );

    const result = await provisionarAutomatizacionBaseService(
      "cli_007",
      "client_invoice_mark_paid",
    );

    expect(result.created).toBe(true);
    expect(result.template_key).toBe("client_invoice_mark_paid");
    expect(result.automatizacion.n8n_workflow_id).toBe(
      "automation_client_invoice_mark_paid",
    );
  });

  test("permite provisionar la cancelacion reversible de factura pendiente por template explicito", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: { id: "cli_008" },
        insertedAutomation: {
          id: "auto_008",
          cliente_id: "cli_008",
          nombre: "Cancelacion reversible de factura pendiente",
          descripcion: "desc",
          n8n_workflow_id: "automation_client_invoice_cancel",
          estado: "activo",
          frecuencia: "manual",
        },
      }),
    );

    const result = await provisionarAutomatizacionBaseService(
      "cli_008",
      "client_invoice_cancel",
    );

    expect(result.created).toBe(true);
    expect(result.template_key).toBe("client_invoice_cancel");
    expect(result.automatizacion.n8n_workflow_id).toBe(
      "automation_client_invoice_cancel",
    );
  });

  test("permite provisionar la anulacion reversible de factura pagada por template explicito", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock({
        cliente: { id: "cli_009" },
        insertedAutomation: {
          id: "auto_009",
          cliente_id: "cli_009",
          nombre: "Anulacion reversible de factura pagada",
          descripcion: "desc",
          n8n_workflow_id: "automation_client_invoice_void_paid",
          estado: "activo",
          frecuencia: "manual",
        },
      }),
    );

    const result = await provisionarAutomatizacionBaseService(
      "cli_009",
      "client_invoice_void_paid",
    );

    expect(result.created).toBe(true);
    expect(result.template_key).toBe("client_invoice_void_paid");
    expect(result.automatizacion.n8n_workflow_id).toBe(
      "automation_client_invoice_void_paid",
    );
  });
});
