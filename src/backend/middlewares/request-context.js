"use strict";

const crypto = require("crypto");

function requestContextMiddleware(req, _res, next) {
  const headerCorrelationId = req.headers["x-correlation-id"];
  req.correlationId =
    typeof headerCorrelationId === "string" && headerCorrelationId.trim() !== ""
      ? headerCorrelationId
      : crypto.randomUUID();

  next();
}

module.exports = {
  requestContextMiddleware,
};
