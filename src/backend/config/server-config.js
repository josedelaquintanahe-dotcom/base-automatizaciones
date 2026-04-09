"use strict";

const DEFAULT_PORT = 3000;
const DEFAULT_NODE_ENV = "development";
const DEFAULT_BASE_API_PATH = "/api";
const ALLOWED_NODE_ENVS = new Set(["development", "staging", "production", "test"]);
const REQUIRED_INTEGRATION_VARS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "N8N_WEBHOOK_BASE_URL",
  "JWT_SECRET",
];

function isValidAbsoluteUrl(value) {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch (error) {
    return false;
  }
}

function readPort(value) {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsedPort = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(
      "Configuracion invalida: PORT debe ser un numero entero entre 1 y 65535.",
    );
  }

  return parsedPort;
}

function readNodeEnv(value) {
  const nodeEnv = value || DEFAULT_NODE_ENV;

  if (!ALLOWED_NODE_ENVS.has(nodeEnv)) {
    throw new Error(
      "Configuracion invalida: NODE_ENV debe ser development, staging, production o test.",
    );
  }

  return nodeEnv;
}

function readBaseApiPath(value) {
  const baseApiPath = value || DEFAULT_BASE_API_PATH;

  if (!baseApiPath.startsWith("/")) {
    throw new Error("Configuracion invalida: BASE_API_PATH debe empezar por '/'.");
  }

  if (baseApiPath.length > 1 && baseApiPath.endsWith("/")) {
    throw new Error(
      "Configuracion invalida: BASE_API_PATH no debe terminar con '/' salvo que sea '/'.",
    );
  }

  return baseApiPath;
}

function readCorsAllowedOrigins(value) {
  if (!value) {
    return [];
  }

  const origins = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return [];
  }

  const invalidOrigins = origins.filter((origin) => !isValidAbsoluteUrl(origin));

  if (invalidOrigins.length > 0) {
    throw new Error(
      `Configuracion invalida: CORS_ALLOWED_ORIGINS contiene origenes no validos: ${invalidOrigins.join(", ")}.`,
    );
  }

  return origins;
}

function getServerConfig() {
  return {
    port: readPort(process.env.PORT),
    nodeEnv: readNodeEnv(process.env.NODE_ENV),
    baseApiPath: readBaseApiPath(process.env.BASE_API_PATH),
    corsAllowedOrigins: readCorsAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
  };
}

function validateEnvironmentConfig(config) {
  const errors = [];
  const warnings = [];

  if (!config || !Number.isInteger(config.port)) {
    errors.push("PORT no esta definido correctamente.");
  }

  if (!config || !ALLOWED_NODE_ENVS.has(config.nodeEnv)) {
    errors.push("NODE_ENV no esta definido correctamente.");
  }

  if (!config || typeof config.baseApiPath !== "string" || !config.baseApiPath.startsWith("/")) {
    errors.push("BASE_API_PATH no esta definido correctamente.");
  }

  if (!config || !Array.isArray(config.corsAllowedOrigins)) {
    errors.push("CORS_ALLOWED_ORIGINS no esta definido correctamente.");
  }

  const missingIntegrationVars = REQUIRED_INTEGRATION_VARS.filter((key) => !process.env[key]);
  const hasEncryptionKey =
    typeof process.env.ENCRYPTION_KEY === "string" && process.env.ENCRYPTION_KEY.trim().length > 0;

  if (config.nodeEnv === "staging" || config.nodeEnv === "production") {
    if (missingIntegrationVars.length > 0) {
      errors.push(
        `Faltan variables obligatorias de integracion para ${config.nodeEnv}: ${missingIntegrationVars.join(", ")}. Revisa .env y la configuracion del entorno antes de iniciar el backend.`,
      );
    }

    if (!hasEncryptionKey) {
      errors.push(`Falta ENCRYPTION_KEY para ${config.nodeEnv}. Revisa .env antes de iniciar el backend.`);
    }
  } else if (missingIntegrationVars.length > 0) {
    warnings.push(
      `Entorno local o de prueba: faltan variables de integracion opcionales para este arranque: ${missingIntegrationVars.join(", ")}. El backend puede iniciar porque no se estan exigiendo integraciones reales en este entorno.`,
    );
  }

  if ((config.nodeEnv === "development" || config.nodeEnv === "test") && !hasEncryptionKey) {
    warnings.push(
      `Entorno ${config.nodeEnv}: falta ENCRYPTION_KEY. El backend puede iniciar, pero las utilidades de cifrado fallaran hasta configurarla.`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

module.exports = {
  getServerConfig,
  validateEnvironmentConfig,
};
