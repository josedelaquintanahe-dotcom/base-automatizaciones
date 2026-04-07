"use strict";

const express = require("express");

const { healthController } = require("../controllers/health-controller");
const { createSystemRouter } = require("./system.routes");

function registerRoutes(app, config) {
  const router = express.Router();

  router.get("/health", healthController);
  router.use("/system", createSystemRouter());

  app.use(config.baseApiPath, router);
}

module.exports = {
  registerRoutes,
};
