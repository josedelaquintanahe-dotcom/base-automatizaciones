"use strict";

const { log } = require("../app/logger");

function notFoundMiddleware(req, res, _next) {
  res.status(404).json({
    status: "error",
    error: "route_not_found",
    correlationId: req.correlationId || null,
    timestamp: new Date().toISOString(),
  });
}

function errorHandlerMiddleware(err, req, res, _next) {
  const statusCode =
    err && Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode <= 599
      ? err.statusCode
      : 500;

  log("error", "Unhandled backend error", {
    correlationId: req.correlationId || null,
    method: req.method,
    path: req.originalUrl,
    statusCode,
  });

  const isDev = process.env.NODE_ENV !== "production";

  res.status(statusCode).json({
    status: "error",
    error: statusCode === 500 ? "internal_server_error" : "request_failed",
    correlationId: req.correlationId || null,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  notFoundMiddleware,
  errorHandlerMiddleware,
};
