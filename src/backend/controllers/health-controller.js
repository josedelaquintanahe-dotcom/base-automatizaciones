"use strict";

function healthController(req, res) {
  res.status(200).json({
    status: "ok",
    service: "backend",
    correlationId: req.correlationId || null,
  });
}

module.exports = {
  healthController,
};
