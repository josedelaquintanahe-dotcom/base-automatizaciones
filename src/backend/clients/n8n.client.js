"use strict";

function getN8nClientConfig() {
  return {
    webhookBaseUrl: process.env.N8N_WEBHOOK_BASE_URL || "",
  };
}

function isValidAbsoluteUrl(value) {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch (error) {
    return false;
  }
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function validateN8nClientConfig(options = {}) {
  const config = getN8nClientConfig();
  const missing = [];
  const errors = [];
  const requireBaseUrl = options.requireBaseUrl !== false;

  if (!config.webhookBaseUrl) {
    if (requireBaseUrl) {
      missing.push("N8N_WEBHOOK_BASE_URL");
    }
  } else if (!isValidAbsoluteUrl(config.webhookBaseUrl)) {
    errors.push("N8N_WEBHOOK_BASE_URL no contiene una URL absoluta valida.");
  }

  return {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
    config: {
      webhookBaseUrl: normalizeBaseUrl(config.webhookBaseUrl),
    },
  };
}

function getSafeN8nTarget(webhookUrl) {
  try {
    const parsedUrl = new URL(webhookUrl);
    return `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch (error) {
    return "invalid_webhook_url";
  }
}

function buildN8nWebhookUrl(path) {
  const validation = validateN8nClientConfig({ requireBaseUrl: true });

  if (!validation.isValid) {
    const issues = [...validation.missing, ...validation.errors];
    throw new Error(`Configuracion incompleta de n8n: ${issues.join(", ")}.`);
  }

  const normalizedPath = String(path || "").trim().replace(/^\/+/, "");

  if (!normalizedPath) {
    throw new Error("Configuracion incompleta de n8n: falta path de webhook.");
  }

  return `${validation.config.webhookBaseUrl}/${normalizedPath}`;
}

async function postN8nWebhook({ url, payload, headers = {} }) {
  if (!isValidAbsoluteUrl(url)) {
    throw new Error("Configuracion invalida de n8n: la URL del webhook no es absoluta.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  const rawText = typeof response.text === "function" ? await response.text() : "";
  let data = rawText;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (error) {
    data = rawText;
  }

  return {
    ok: response.ok,
    status: response.status,
    url,
    target: getSafeN8nTarget(url),
    rawText,
    data,
  };
}

async function triggerN8nWebhookPath({ path, payload, headers = {} }) {
  const url = buildN8nWebhookUrl(path);
  return postN8nWebhook({ url, payload, headers });
}

function createN8nClientPlaceholder() {
  const validation = validateN8nClientConfig({ requireBaseUrl: false });

  return {
    provider: "n8n",
    status: validation.isValid ? "config_ready" : "config_incomplete",
    config: {
      webhookBaseUrl: validation.config.webhookBaseUrl,
    },
    missingVariables: validation.missing,
    validationErrors: validation.errors,
    note: "Adaptador HTTP de n8n disponible para invocar webhooks desde servicios backend.",
  };
}

module.exports = {
  getN8nClientConfig,
  validateN8nClientConfig,
  getSafeN8nTarget,
  buildN8nWebhookUrl,
  postN8nWebhook,
  triggerN8nWebhookPath,
  createN8nClientPlaceholder,
};
