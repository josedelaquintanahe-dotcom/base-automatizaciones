"use strict";

const express = require("express");

const { getSystemStatus } = require("../controllers/system.controller");

function createSystemRouter() {
  const router = express.Router();

  router.get("/status", getSystemStatus);

  return router;
}

module.exports = {
  createSystemRouter,
};
