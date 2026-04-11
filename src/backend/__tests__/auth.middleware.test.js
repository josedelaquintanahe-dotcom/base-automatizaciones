"use strict";

// Mock de los módulos con dependencias externas ANTES de require
jest.mock("../clients/supabase.client");
jest.mock("../app/logger", () => ({ log: jest.fn() }));

const { authMiddleware } = require("../middlewares/auth.middleware");
const { createSupabaseClient } = require("../clients/supabase.client");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildReq(overrides = {}) {
  return {
    headers: {},
    originalUrl: "/api/test",
    correlationId: "test-correlation-id",
    ...overrides,
  };
}

function buildRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Token válido según validarToken: >= 20 chars, solo [A-Za-z0-9_-]
const TOKEN_VALIDO = "client_abcdefghij1234567890abcd";

function buildSupabaseMock(data, error = null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data, error });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { from };
}

beforeEach(() => {
  process.env.ENCRYPTION_KEY = "clave-test-1234567890abcdef";
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-test";
});

afterEach(() => {
  jest.resetAllMocks();
  delete process.env.ENCRYPTION_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("authMiddleware", () => {
  test("retorna 401 si falta el header Authorization", async () => {
    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("retorna 401 si el header no tiene formato 'Bearer <token>'", async () => {
    const req = buildReq({ headers: { authorization: "Basic abc123" } });
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("retorna 401 si el token tiene formato inválido (menos de 20 chars)", async () => {
    const req = buildReq({ headers: { authorization: "Bearer corto" } });
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("retorna 401 si el token no existe en la base de datos", async () => {
    createSupabaseClient.mockReturnValue(buildSupabaseMock(null));

    const req = buildReq({ headers: { authorization: `Bearer ${TOKEN_VALIDO}` } });
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("retorna 401 si la base de datos devuelve un error", async () => {
    createSupabaseClient.mockReturnValue(
      buildSupabaseMock(null, { message: "DB error" }),
    );

    const req = buildReq({ headers: { authorization: `Bearer ${TOKEN_VALIDO}` } });
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("retorna 401 si el token está inactivo", async () => {
    const tokenData = {
      id: "tok_1",
      cliente_id: "cli_1",
      activo: false,
      expiracion: null,
    };
    createSupabaseClient.mockReturnValue(buildSupabaseMock(tokenData));

    const req = buildReq({ headers: { authorization: `Bearer ${TOKEN_VALIDO}` } });
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/inactivo/i) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("retorna 401 si el token está expirado", async () => {
    const tokenData = {
      id: "tok_2",
      cliente_id: "cli_1",
      activo: true,
      expiracion: "2000-01-01", // Fecha en el pasado
    };
    createSupabaseClient.mockReturnValue(buildSupabaseMock(tokenData));

    const req = buildReq({ headers: { authorization: `Bearer ${TOKEN_VALIDO}` } });
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/expirado/i) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("llama a next() y adjunta req.auth si el token es válido", async () => {
    const tokenData = {
      id: "tok_3",
      cliente_id: "cli_abc",
      activo: true,
      expiracion: "2099-12-31", // Fecha futura
    };
    createSupabaseClient.mockReturnValue(buildSupabaseMock(tokenData));

    const req = buildReq({ headers: { authorization: `Bearer ${TOKEN_VALIDO}` } });
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.cliente_id).toBe("cli_abc");
    expect(req.auth).toEqual({ cliente_id: "cli_abc", token_id: "tok_3" });
    expect(res.status).not.toHaveBeenCalled();
  });

  test("acepta token sin fecha de expiración (sin límite de tiempo)", async () => {
    const tokenData = {
      id: "tok_4",
      cliente_id: "cli_xyz",
      activo: true,
      expiracion: null,
    };
    createSupabaseClient.mockReturnValue(buildSupabaseMock(tokenData));

    const req = buildReq({ headers: { authorization: `Bearer ${TOKEN_VALIDO}` } });
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.cliente_id).toBe("cli_xyz");
  });

  test("retorna 401 si el header Authorization está vacío después de 'Bearer'", async () => {
    const req = buildReq({ headers: { authorization: "Bearer " } });
    const res = buildRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
