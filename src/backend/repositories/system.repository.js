"use strict";

const {
  createSupabaseClientPlaceholder,
  checkSupabaseConnectivity,
  validateSupabaseClientConfig,
} = require("../clients/supabase.client");

function getRepositoryStatus() {
  const validation = validateSupabaseClientConfig({ keyType: "anon" });
  const clientInfo = createSupabaseClientPlaceholder();

  return {
    repository: "system",
    provider: "supabase",
    status: validation.isValid ? "ready_for_queries" : "config_incomplete",
    missingVariables: validation.missing,
    note: "Repository base conservador. Preparado para consultas reales con privilegios minimos.",
    clientInfo,
  };
}

async function getSystemStatus() {
  const validation = validateSupabaseClientConfig({ keyType: "anon" });
  const connectivityTarget = "auth/v1/settings";

  if (!validation.isValid) {
    return {
      status: "config_incomplete",
      provider: "supabase",
      connectivity: "not_checked",
      queryTarget: connectivityTarget,
      missingVariables: validation.missing,
      error:
        validation.errors.length > 0
          ? {
              message: validation.errors.join(" "),
            }
          : null,
      fallback: true,
      note: "Supabase no esta configurado todavia. No se ejecuta la verificacion tecnica de conectividad.",
    };
  }

  const probe = await checkSupabaseConnectivity({ keyType: "anon" });

  if (probe.ok) {
    return {
      status: "ok",
      provider: "supabase",
      connectivity: "reachable",
      queryTarget: probe.target,
      fallback: false,
      note: "Conectividad real verificada contra el endpoint tecnico de Supabase con anon key.",
    };
  }

  return {
    status: "fallback",
    provider: "supabase",
    connectivity: "error",
    queryTarget: probe.target || connectivityTarget,
    fallback: true,
    missingVariables: probe.missingVariables || [],
    validationErrors: probe.validationErrors || [],
    error: probe.error || {
      message: "unknown_error",
    },
    note: "No se pudo verificar conectividad real con Supabase.",
  };
}

module.exports = {
  getRepositoryStatus,
  getSystemStatus,
};
