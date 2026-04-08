"use strict";

const express = require("express");

const { authMiddleware } = require("../middlewares/auth.middleware");
const {
  onboardingController,
  obtenerClienteController,
} = require("../controllers/cliente.controller");

function createClienteRouter() {
  const router = express.Router();

  router.post("/onboarding", onboardingController);
  router.get("/:cliente_id", authMiddleware, obtenerClienteController);

  return router;
}

module.exports = {
  createClienteRouter,
};
