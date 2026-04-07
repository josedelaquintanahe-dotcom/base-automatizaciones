"use strict";

const { getSystemStatusService } = require("../services/system.service");

async function getSystemStatus(req, res, next) {
  try {
    const payload = await getSystemStatusService({
      correlationId: req.correlationId || null,
    });

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSystemStatus,
};
