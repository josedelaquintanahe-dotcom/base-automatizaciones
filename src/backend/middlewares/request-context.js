"use strict";

const crypto = require("crypto");

function isValidCorrelationId(value) {
  return typeof value === "string" && value.trim() !== "" && value.length <= 128;
}

function requestContextMiddleware(req, _res, next) {
  const headerCorrelationId = req.headers["x-correlation-id"];
  req.correlationId =
    isValidCorrelationId(headerCorrelationId)
      ? headerCorrelationId
      : crypto.randomUUID();

  _res.setHeader("x-correlation-id", req.correlationId);

  next();
}

module.exports = {
  requestContextMiddleware,
};
