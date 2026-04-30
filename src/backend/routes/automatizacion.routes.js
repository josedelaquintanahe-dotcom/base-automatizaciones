"use strict";

const express = require("express");

const { authMiddleware } = require("../middlewares/auth.middleware");
const { backofficeAuthMiddleware } = require("../middlewares/backoffice-auth.middleware");
const {
  ejecutarWorkflowBackofficeController,
  ejecutarWorkflowController,
  listarAutomatizacionesBackofficeController,
  obtenerStatusController,
  pausarWorkflowController,
  provisionarAutomatizacionBaseController,
} = require("../controllers/automatizacion.controller");

function createAutomatizacionRouter() {
  const router = express.Router();

  router.get(
    "/backoffice/:cliente_id",
    backofficeAuthMiddleware,
    listarAutomatizacionesBackofficeController,
  );
  router.post(
    "/backoffice/:cliente_id/provisionar-base",
    backofficeAuthMiddleware,
    provisionarAutomatizacionBaseController,
  );
  router.post(
    "/backoffice/:cliente_id/:workflow_id/ejecutar",
    backofficeAuthMiddleware,
    ejecutarWorkflowBackofficeController,
  );
  router.post("/:cliente_id/:workflow_id/ejecutar", authMiddleware, ejecutarWorkflowController);
  router.get("/:cliente_id/:workflow_id/status", authMiddleware, obtenerStatusController);
  router.post("/:workflow_id/pausar", authMiddleware, pausarWorkflowController);

  return router;
}

module.exports = {
  createAutomatizacionRouter,
};
