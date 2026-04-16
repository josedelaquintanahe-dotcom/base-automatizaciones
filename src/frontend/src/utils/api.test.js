import { describe, test, expect, beforeEach } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

// Importamos después de haber preparado el entorno
import {
  parseApiError,
  getHealth,
  getSystemStatus,
  crearCliente,
  listarClientes,
  obtenerClienteBackoffice,
  obtenerCliente,
  api,
} from "./api";

const mock = new MockAdapter(api);

beforeEach(() => {
  mock.reset();
});

// ─── parseApiError ────────────────────────────────────────────────────────────

describe("parseApiError", () => {
  function makeAxiosError(status, backendError = null, noResponse = false) {
    const error = new axios.AxiosError("error de red");

    if (noResponse) {
      error.response = undefined;
      error.request = {};
    } else {
      error.response = {
        status,
        data: backendError ? { error: backendError } : {},
      };
    }

    return error;
  }

  test("error 400: retorna el mensaje del backend si está disponible", () => {
    const err = makeAxiosError(400, "Datos inválidos en el campo email");
    const parsed = parseApiError(err);
    expect(parsed.message).toBe("Datos inválidos en el campo email");
    expect(parsed.status).toBe(400);
  });

  test("error 400 sin mensaje backend: usa texto genérico", () => {
    const err = makeAxiosError(400);
    const parsed = parseApiError(err);
    expect(parsed.message).toMatch(/revisa/i);
    expect(parsed.status).toBe(400);
  });

  test("error 401: retorna 'No autorizado'", () => {
    const err = makeAxiosError(401);
    const parsed = parseApiError(err);
    expect(parsed.message).toBe("No autorizado");
    expect(parsed.status).toBe(401);
  });

  test("error 403: retorna 'No autorizado'", () => {
    const err = makeAxiosError(403);
    const parsed = parseApiError(err);
    expect(parsed.message).toBe("No autorizado");
    expect(parsed.status).toBe(403);
  });

  test("error 404: retorna 'Recurso no encontrado'", () => {
    const err = makeAxiosError(404);
    const parsed = parseApiError(err);
    expect(parsed.message).toBe("Recurso no encontrado");
    expect(parsed.status).toBe(404);
  });

  test("error 500: retorna 'Error interno del servidor'", () => {
    const err = makeAxiosError(500);
    const parsed = parseApiError(err);
    expect(parsed.message).toBe("Error interno del servidor");
    expect(parsed.status).toBe(500);
  });

  test("error 503 (>= 500): retorna 'Error interno del servidor'", () => {
    const err = makeAxiosError(503);
    const parsed = parseApiError(err);
    expect(parsed.message).toBe("Error interno del servidor");
  });

  test("sin respuesta (error de red): retorna mensaje de conexión", () => {
    const err = makeAxiosError(null, null, true);
    const parsed = parseApiError(err);
    expect(parsed.message).toMatch(/conectar/i);
    expect(parsed.status).toBeNull();
  });

  test("error no-axios: usa el message del Error y status es null", () => {
    const err = new Error("Error de JavaScript puro");
    const parsed = parseApiError(err);
    expect(parsed.message).toBe("Error de JavaScript puro");
    // createApiError usa null como default para status cuando no se pasa argumento
    expect(parsed.status).toBeNull();
  });

  test("el error parseado es una instancia de Error", () => {
    const parsed = parseApiError(makeAxiosError(500));
    expect(parsed).toBeInstanceOf(Error);
  });

  test("incluye details con el mensaje de backend cuando existe", () => {
    const err = makeAxiosError(400, "El campo plan es inválido");
    const parsed = parseApiError(err);
    expect(parsed.details).toBe("El campo plan es inválido");
  });
});

// ─── getHealth ────────────────────────────────────────────────────────────────

describe("getHealth", () => {
  test("retorna datos cuando la API responde 200", async () => {
    mock.onGet("/health").reply(200, { status: "ok" });
    const data = await getHealth();
    expect(data).toEqual({ status: "ok" });
  });

  test("lanza error parseado cuando la API falla con 500", async () => {
    mock.onGet("/health").reply(500);
    await expect(getHealth()).rejects.toMatchObject({
      message: "Error interno del servidor",
      status: 500,
    });
  });

  test("lanza error de red cuando no hay respuesta", async () => {
    mock.onGet("/health").networkError();
    await expect(getHealth()).rejects.toMatchObject({
      message: expect.stringMatching(/conectar/i),
    });
  });
});

// ─── getSystemStatus ──────────────────────────────────────────────────────────

describe("getSystemStatus", () => {
  test("retorna datos cuando la API responde 200", async () => {
    mock.onGet("/system/status").reply(200, { database: "ok" });
    const data = await getSystemStatus();
    expect(data).toEqual({ database: "ok" });
  });

  test("lanza error parseado cuando la API falla con 503", async () => {
    mock.onGet("/system/status").reply(503);
    await expect(getSystemStatus()).rejects.toMatchObject({
      message: "Error interno del servidor",
    });
  });
});

// ─── crearCliente ─────────────────────────────────────────────────────────────

describe("crearCliente", () => {
  const datosCliente = {
    nombre_empresa: "Empresa Test",
    email: "test@empresa.com",
    plan: "basico",
    credenciales: { api_key: "123" },
  };

  test("retorna datos del cliente cuando la API responde 200", async () => {
    mock.onPost("/clientes/onboarding").reply(200, { cliente_id: "abc123" });
    const data = await crearCliente(datosCliente);
    expect(data).toEqual({ cliente_id: "abc123" });
  });

  test("lanza error 400 con mensaje del backend", async () => {
    mock
      .onPost("/clientes/onboarding")
      .reply(400, { error: "email ya registrado" });
    await expect(crearCliente(datosCliente)).rejects.toMatchObject({
      message: "email ya registrado",
      status: 400,
    });
  });
});

// ─── obtenerCliente ───────────────────────────────────────────────────────────

describe("listarClientes", () => {
  const TOKEN = "backoffice_token_seguro";

  test("realiza la peticion con el header Authorization correcto", async () => {
    mock.onGet("/clientes").reply((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${TOKEN}`);
      return [200, { clientes: [] }];
    });

    const data = await listarClientes(TOKEN);
    expect(data).toEqual({ clientes: [] });
  });

  test("lanza error 401 cuando el token de backoffice es invalido", async () => {
    mock.onGet("/clientes").reply(401, { error: "Token de backoffice invalido." });

    await expect(listarClientes("token_incorrecto")).rejects.toMatchObject({
      message: "No autorizado",
      status: 401,
    });
  });
});

describe("obtenerClienteBackoffice", () => {
  const TOKEN = "backoffice_token_seguro";

  test("realiza la peticion de detalle con Authorization correcto", async () => {
    mock.onGet("/clientes/backoffice/cli_001").reply((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${TOKEN}`);
      return [200, { detail: { cliente: { id: "cli_001" } } }];
    });

    const data = await obtenerClienteBackoffice("cli_001", TOKEN);
    expect(data.cliente.id).toBe("cli_001");
  });

  test("lanza error 404 cuando el cliente no existe en backoffice", async () => {
    mock.onGet("/clientes/backoffice/no-existe").reply(404);

    await expect(obtenerClienteBackoffice("no-existe", TOKEN)).rejects.toMatchObject({
      message: "Recurso no encontrado",
      status: 404,
    });
  });
});

describe("obtenerCliente", () => {
  const TOKEN = "client_abcdefghijklmnopqrstuvwx";

  test("realiza la petición con el header Authorization correcto", async () => {
    mock.onGet("/clientes/cli_001").reply((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${TOKEN}`);
      return [200, { cliente_id: "cli_001" }];
    });

    const data = await obtenerCliente("cli_001", TOKEN);
    expect(data.cliente_id).toBe("cli_001");
  });

  test("lanza error 401 cuando el token es inválido", async () => {
    mock.onGet("/clientes/cli_001").reply(401, { error: "Token invalido" });
    await expect(obtenerCliente("cli_001", "token-malo")).rejects.toMatchObject({
      message: "No autorizado",
      status: 401,
    });
  });

  test("lanza error 404 cuando el cliente no existe", async () => {
    mock.onGet("/clientes/no-existe").reply(404);
    await expect(obtenerCliente("no-existe", TOKEN)).rejects.toMatchObject({
      message: "Recurso no encontrado",
      status: 404,
    });
  });
});
