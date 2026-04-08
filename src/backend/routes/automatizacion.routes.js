"use strict";

const express = require("express");

const { authMiddleware } = require("../middlewares/auth.middleware");
const {
  ejecutarWorkflowController,
  obtenerStatusController,
  pausarWorkflowController,
} = require("../controllers/automatizacion.controller");

function createAutomatizacionRouter() {
  const router = express.Router();

  router.post("/:cliente_id/:workflow_id/ejecutar", authMiddleware, ejecutarWorkflowController);
  router.get("/:cliente_id/:workflow_id/status", authMiddleware, obtenerStatusController);
  router.post("/:workflow_id/pausar", authMiddleware, pausarWorkflowController);

  return router;
}

module.exports = {
  createAutomatizacionRouter,
};
