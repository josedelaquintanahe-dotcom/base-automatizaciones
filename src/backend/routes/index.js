"use strict";

const express = require("express");

const { createClienteRouter } = require("./cliente.routes");
const { createAutomatizacionRouter } = require("./automatizacion.routes");
const { healthController } = require("../controllers/health-controller");
const { createSystemRouter } = require("./system.routes");

function registerRoutes(app, config) {
  const router = express.Router();

  router.get("/health", healthController);
  router.use("/system", createSystemRouter());
  router.use("/clientes", createClienteRouter());
  router.use("/automatizaciones", createAutomatizacionRouter());

  app.use(config.baseApiPath, router);
}

module.exports = {
  registerRoutes,
};
