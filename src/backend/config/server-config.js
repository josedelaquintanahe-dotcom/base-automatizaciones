"use strict";

function getServerConfig() {
  return {
    port: Number.parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    baseApiPath: process.env.BASE_API_PATH || "/api",
  };
}

module.exports = {
  getServerConfig,
};
