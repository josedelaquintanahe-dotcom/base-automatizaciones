"use strict";

function healthController(req, res) {
  res.status(200).json({
    status: "ok",
    service: "backend",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId || null,
  });
}

module.exports = {
  healthController,
};
