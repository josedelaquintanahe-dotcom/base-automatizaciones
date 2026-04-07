"use strict";

function notFoundMiddleware(req, res, _next) {
  res.status(404).json({
    status: "error",
    error: "route_not_found",
    correlationId: req.correlationId || null,
  });
}

function errorHandlerMiddleware(err, req, res, _next) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "Unhandled backend error",
      correlationId: req.correlationId || null,
      error: err && err.message ? err.message : "unknown_error",
    }),
  );

  res.status(500).json({
    status: "error",
    error: "internal_server_error",
    correlationId: req.correlationId || null,
  });
}

module.exports = {
  notFoundMiddleware,
  errorHandlerMiddleware,
};
