"use strict";

const express = require("express");

const { authMiddleware } = require("../middlewares/auth.middleware");
const { backofficeAuthMiddleware } = require("../middlewares/backoffice-auth.middleware");
const {
  listarClientesController,
  onboardingController,
  obtenerClienteController,
} = require("../controllers/cliente.controller");

function createClienteRouter() {
  const router = express.Router();

  router.get("/", backofficeAuthMiddleware, listarClientesController);
  router.post("/onboarding", onboardingController);
  router.get("/:cliente_id", authMiddleware, obtenerClienteController);

  return router;
}

module.exports = {
  createClienteRouter,
};
