"use strict";

const {
  buildN8nWebhookUrl,
  getSafeN8nTarget,
  postN8nWebhook,
  validateN8nClientConfig,
} = require("../clients/n8n.client");

describe("n8n.client", () => {
  const originalBaseUrl = process.env.N8N_WEBHOOK_BASE_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    delete process.env.N8N_WEBHOOK_BASE_URL;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;

    if (originalBaseUrl === undefined) {
      delete process.env.N8N_WEBHOOK_BASE_URL;
    } else {
      process.env.N8N_WEBHOOK_BASE_URL = originalBaseUrl;
    }
  });

  test("detecta falta de N8N_WEBHOOK_BASE_URL cuando es obligatoria", () => {
    const result = validateN8nClientConfig();

    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual(["N8N_WEBHOOK_BASE_URL"]);
  });

  test("construye la URL final del webhook a partir de la base", () => {
    process.env.N8N_WEBHOOK_BASE_URL = "https://n8n.example.com/webhook/";

    expect(buildN8nWebhookUrl("/cliente-cli-001-flow-001")).toBe(
      "https://n8n.example.com/webhook/cliente-cli-001-flow-001",
    );
  });

  test("normaliza el target seguro del webhook", () => {
    expect(getSafeN8nTarget("https://n8n.example.com/webhook/onboarding?foo=bar")).toBe(
      "https://n8n.example.com/webhook/onboarding",
    );
  });

  test("ejecuta POST JSON y parsea respuesta JSON", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 202,
      text: jest.fn().mockResolvedValue('{"accepted":true}'),
    });

    const result = await postN8nWebhook({
      url: "https://n8n.example.com/webhook/onboarding",
      payload: {
        event_name: "onboarding_activated",
      },
      headers: {
        "x-correlation-id": "corr-200",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://n8n.example.com/webhook/onboarding",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "content-type": "application/json",
          "x-correlation-id": "corr-200",
        }),
        body: JSON.stringify({
          event_name: "onboarding_activated",
        }),
      }),
    );
    expect(result).toMatchObject({
      ok: true,
      status: 202,
      data: {
        accepted: true,
      },
      target: "https://n8n.example.com/webhook/onboarding",
    });
  });

  test("lanza error si la URL del webhook no es absoluta", async () => {
    await expect(
      postN8nWebhook({
        url: "/webhook/local",
        payload: {},
      }),
    ).rejects.toThrow(/URL del webhook/);
  });
});
