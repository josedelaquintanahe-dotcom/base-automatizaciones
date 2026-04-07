"use strict";

const { log } = require("../app/logger");

function requestLoggerMiddleware(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    log("info", "HTTP request completed", {
      correlationId: req.correlationId || null,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}

module.exports = {
  requestLoggerMiddleware,
};
