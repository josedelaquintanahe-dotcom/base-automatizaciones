"use strict";

const express = require("express");

const { getServerConfig } = require("../config/server-config");
const { registerRoutes } = require("../routes");
const { requestContextMiddleware } = require("../middlewares/request-context");
const { notFoundMiddleware, errorHandlerMiddleware } = require("../middlewares/error-handler");

function createServer() {
  const app = express();
  const config = getServerConfig();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestContextMiddleware);

  registerRoutes(app, config);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return { app, config };
}

function startServer() {
  const { app, config } = createServer();

  app.listen(config.port, () => {
    console.log(
      JSON.stringify({
        level: "info",
        message: "Backend Express inicializado",
        port: config.port,
        baseApiPath: config.baseApiPath,
        nodeEnv: config.nodeEnv,
      }),
    );
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  startServer,
};
