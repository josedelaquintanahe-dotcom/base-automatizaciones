"use strict";

const { getSystemStatus: getSystemStatusRepository } = require("../repositories/system.repository");

async function getSystemStatusService(context = {}) {
  const repositoryResult = await getSystemStatusRepository();

  return {
    status: repositoryResult.status,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    correlationId: context.correlationId || null,
    provider: repositoryResult.provider,
    connectivity: repositoryResult.connectivity,
    queryTarget: repositoryResult.queryTarget,
    tableExists:
      typeof repositoryResult.tableExists === "boolean" ? repositoryResult.tableExists : null,
    fallback: Boolean(repositoryResult.fallback),
    missingVariables: repositoryResult.missingVariables || [],
    validationErrors: repositoryResult.validationErrors || [],
    count: typeof repositoryResult.count === "number" ? repositoryResult.count : null,
    error: repositoryResult.error || null,
    note: repositoryResult.note,
  };
}

module.exports = {
  getSystemStatusService,
};
