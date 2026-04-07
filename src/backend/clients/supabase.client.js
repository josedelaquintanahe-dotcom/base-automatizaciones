"use strict";

const { createClient } = require("@supabase/supabase-js");

function getSupabaseClientConfig() {
  return {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function isValidAbsoluteUrl(value) {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch (error) {
    return false;
  }
}

function validateSupabaseClientConfig(options = {}) {
  const config = getSupabaseClientConfig();
  const missing = [];
  const errors = [];
  const requireServiceRole = options.keyType === "service_role";

  if (!config.url) {
    missing.push("SUPABASE_URL");
  } else if (!isValidAbsoluteUrl(config.url)) {
    errors.push("SUPABASE_URL no contiene una URL absoluta valida.");
  }

  if (!requireServiceRole && !config.anonKey) {
    missing.push("SUPABASE_ANON_KEY");
  }

  if (requireServiceRole && !config.serviceRoleKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
    config,
  };
}

function createSupabaseClient(options = {}) {
  const keyType = options.keyType === "service_role" ? "service_role" : "anon";
  const validation = validateSupabaseClientConfig({ keyType });

  if (!validation.isValid) {
    const validationIssues = [...validation.missing, ...validation.errors];
    throw new Error(
      `Configuracion incompleta de Supabase: ${validationIssues.join(", ")}.`,
    );
  }

  const keyField = keyType === "service_role" ? "serviceRoleKey" : "anonKey";
  const selectedKey = validation.config[keyField];

  if (!selectedKey) {
    throw new Error(`Configuracion incompleta de Supabase: no se ha encontrado ${keyField}.`);
  }

  return createClient(validation.config.url, selectedKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function checkSupabaseConnectivity(options = {}) {
  const keyType = options.keyType === "service_role" ? "service_role" : "anon";
  const validation = validateSupabaseClientConfig({ keyType });

  if (!validation.isValid) {
    return {
      ok: false,
      target: "auth/v1/settings",
      missingVariables: validation.missing,
      validationErrors: validation.errors,
      error: {
        message: `Configuracion incompleta de Supabase: ${[...validation.missing, ...validation.errors].join(", ")}.`,
      },
    };
  }

  const keyField = keyType === "service_role" ? "serviceRoleKey" : "anonKey";
  const selectedKey = validation.config[keyField];
  const target = "auth/v1/settings";
  const endpoint = new URL(target, `${validation.config.url.replace(/\/+$/, "")}/`).toString();

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: selectedKey,
        Authorization: `Bearer ${selectedKey}`,
      },
    });

    if (response.ok) {
      return {
        ok: true,
        target,
        statusCode: response.status,
      };
    }

    const responseText = await response.text();

    return {
      ok: false,
      target,
      statusCode: response.status,
      error: {
        message: responseText || `Supabase respondio con HTTP ${response.status}.`,
      },
    };
  } catch (error) {
    return {
      ok: false,
      target,
      error: {
        message: error && error.message ? error.message : "unknown_error",
      },
    };
  }
}

function createSupabaseClientPlaceholder() {
  const anonValidation = validateSupabaseClientConfig({ keyType: "anon" });
  const serviceRoleValidation = validateSupabaseClientConfig({ keyType: "service_role" });

  return {
    provider: "supabase",
    status: anonValidation.isValid ? "config_ready" : "config_incomplete",
    config: {
      url: anonValidation.config.url,
      anonKeyConfigured: Boolean(anonValidation.config.anonKey),
      serviceRoleKeyConfigured: Boolean(serviceRoleValidation.config.serviceRoleKey),
    },
    missingVariables: {
      anon: anonValidation.missing,
      serviceRole: serviceRoleValidation.missing,
    },
    note: "Cliente real preparado con SDK oficial, pero sin consultas de negocio ejecutadas todavia.",
  };
}

module.exports = {
  getSupabaseClientConfig,
  validateSupabaseClientConfig,
  createSupabaseClient,
  checkSupabaseConnectivity,
  createSupabaseClientPlaceholder,
};
