"use strict";

function getN8nClientConfig() {
  return {
    webhookBaseUrl: process.env.N8N_WEBHOOK_BASE_URL || "",
  };
}

function validateN8nClientConfig() {
  const config = getN8nClientConfig();
  const missing = [];

  if (!config.webhookBaseUrl) {
    missing.push("N8N_WEBHOOK_BASE_URL");
  }

  return {
    isValid: missing.length === 0,
    missing,
    config,
  };
}

function createN8nClientPlaceholder() {
  const validation = validateN8nClientConfig();

  return {
    provider: "n8n",
    status: validation.isValid ? "config_ready" : "config_incomplete",
    config: {
      webhookBaseUrl: validation.config.webhookBaseUrl,
    },
    missingVariables: validation.missing,
    note: "Cliente placeholder de n8n. No ejecuta llamadas HTTP ni activa workflows todavia.",
  };
}

module.exports = {
  getN8nClientConfig,
  validateN8nClientConfig,
  createN8nClientPlaceholder,
};
