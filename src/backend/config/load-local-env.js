"use strict";

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const LOCAL_ENV_PATH = path.resolve(__dirname, "..", ".env.local");

function loadLocalEnv() {
  const currentNodeEnv = process.env.NODE_ENV;
  const shouldLoad = !currentNodeEnv || currentNodeEnv === "development";

  if (!shouldLoad) {
    return {
      loaded: false,
      path: LOCAL_ENV_PATH,
      reason: "dotenv_disabled_for_current_environment",
    };
  }

  if (!fs.existsSync(LOCAL_ENV_PATH)) {
    return {
      loaded: false,
      path: LOCAL_ENV_PATH,
      reason: "local_env_file_not_found",
    };
  }

  dotenv.config({
    path: LOCAL_ENV_PATH,
    override: false,
    quiet: true,
  });

  return {
    loaded: true,
    path: LOCAL_ENV_PATH,
    reason: "local_env_loaded",
  };
}

module.exports = {
  loadLocalEnv,
  LOCAL_ENV_PATH,
};
