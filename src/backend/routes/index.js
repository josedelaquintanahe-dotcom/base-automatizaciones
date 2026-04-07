"use strict";

const express = require("express");

const { healthController } = require("../controllers/health-controller");

function registerRoutes(app, config) {
  const router = express.Router();

  router.get("/health", healthController);

  app.use(config.baseApiPath, router);
}

module.exports = {
  registerRoutes,
};
