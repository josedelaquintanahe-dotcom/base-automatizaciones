"use strict";

const { backofficeAuthMiddleware } = require("../middlewares/backoffice-auth.middleware");

function buildReq(overrides = {}) {
  return {
    headers: {},
    originalUrl: "/api/clientes",
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

describe("backofficeAuthMiddleware", () => {
  const ORIGINAL_TOKEN = process.env.BACKOFFICE_API_TOKEN;

  afterEach(() => {
    jest.restoreAllMocks();

    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.BACKOFFICE_API_TOKEN;
    } else {
      process.env.BACKOFFICE_API_TOKEN = ORIGINAL_TOKEN;
    }
  });

  test("retorna 503 si BACKOFFICE_API_TOKEN no esta configurado", async () => {
    delete process.env.BACKOFFICE_API_TOKEN;

    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await backofficeAuthMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });

  test("retorna 401 si falta Authorization", async () => {
    process.env.BACKOFFICE_API_TOKEN = "backoffice_token_seguro";

    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await backofficeAuthMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("retorna 401 si el token no coincide", async () => {
    process.env.BACKOFFICE_API_TOKEN = "backoffice_token_seguro";

    const req = buildReq({
      headers: {
        authorization: "Bearer token_incorrecto",
      },
    });
    const res = buildRes();
    const next = jest.fn();

    await backofficeAuthMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("adjunta contexto backoffice y llama a next si el token es valido", async () => {
    process.env.BACKOFFICE_API_TOKEN = "backoffice_token_seguro";

    const req = buildReq({
      headers: {
        authorization: "Bearer backoffice_token_seguro",
      },
    });
    const res = buildRes();
    const next = jest.fn();

    await backofficeAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.backoffice).toEqual({ role: "internal_backoffice" });
    expect(res.status).not.toHaveBeenCalled();
  });
});
