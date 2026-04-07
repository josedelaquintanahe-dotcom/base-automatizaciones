"use strict";

const express = require("express");

const { loadLocalEnv } = require("../config/load-local-env");
const localEnvResult = loadLocalEnv();
const { getServerConfig, validateEnvironmentConfig } = require("../config/server-config");
const { log } = require("./logger");
const { registerRoutes } = require("../routes");
const { requestContextMiddleware } = require("../middlewares/request-context");
const { requestLoggerMiddleware } = require("../middlewares/request-logger");
const { notFoundMiddleware, errorHandlerMiddleware } = require("../middlewares/error-handler");

function createServer(config = getServerConfig()) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestContextMiddleware);
  app.use(requestLoggerMiddleware);

  registerRoutes(app, config);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return { app, config };
}

function startServer() {
  let config;

  try {
    config = getServerConfig();
  } catch (error) {
    throw new Error(`No se puede iniciar el backend por configuracion invalida: ${error.message}`);
  }

  const validation = validateEnvironmentConfig(config);

  if (!validation.isValid) {
    throw new Error(
      `No se puede iniciar el backend por configuracion invalida:\n- ${validation.errors.join("\n- ")}`,
    );
  }

  const { app } = createServer(config);

  if (localEnvResult.loaded) {
    log("info", "Archivo .env.local cargado", {
      path: localEnvResult.path,
      nodeEnv: config.nodeEnv,
    });
  }

  validation.warnings.forEach((warning) => {
    log("warn", warning, {
      nodeEnv: config.nodeEnv,
    });
  });

  app.listen(config.port, () => {
    log("info", "Backend Express inicializado", {
      port: config.port,
      baseApiPath: config.baseApiPath,
      nodeEnv: config.nodeEnv,
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  startServer,
};
