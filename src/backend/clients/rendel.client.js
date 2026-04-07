"use strict";

function getRendelClientConfig() {
  return {
    apiKey: process.env.RENDEL_API_KEY || "",
  };
}

function validateRendelClientConfig() {
  const config = getRendelClientConfig();
  const missing = [];

  if (!config.apiKey) {
    missing.push("RENDEL_API_KEY");
  }

  return {
    isValid: missing.length === 0,
    missing,
    config,
  };
}

function createRendelClientPlaceholder() {
  const validation = validateRendelClientConfig();

  return {
    provider: "rendel",
    status: validation.isValid ? "config_ready" : "config_incomplete",
    config: {
      apiKeyConfigured: Boolean(validation.config.apiKey),
    },
    missingVariables: validation.missing,
    note: "Cliente placeholder de Rendel. No ejecuta llamadas externas ni invoca agentes todavia.",
  };
}

module.exports = {
  getRendelClientConfig,
  validateRendelClientConfig,
  createRendelClientPlaceholder,
};
