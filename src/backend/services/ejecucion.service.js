"use strict";

const { log } = require("../app/logger");
const { createSupabaseClient } = require("../clients/supabase.client");
const { desencriptar } = require("../utils/encryption");

function createServiceError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getBackendSupabaseClient() {
  return createSupabaseClient({ keyType: "service_role" });
}

function getWebhookBaseUrl() {
  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL;

  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw createServiceError("Falta N8N_WEBHOOK_BASE_URL para ejecutar workflows.", 500);
  }

  return baseUrl.replace(/\/+$/, "");
}

async function getAutomatizacionByWorkflow(clienteId, workflowId) {
  const supabase = getBackendSupabaseClient();
  const normalizedClienteId = clienteId.trim();
  const normalizedWorkflowId = workflowId.trim();
  const { data, error } = await supabase
    .from("automatizaciones")
    .select("id, cliente_id, nombre, n8n_workflow_id, estado")
    .eq("cliente_id", normalizedClienteId)
    .or(`id.eq.${normalizedWorkflowId},n8n_workflow_id.eq.${normalizedWorkflowId}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw createServiceError(`No se pudo localizar la automatizacion: ${error.message}`);
  }

  if (!data) {
    throw createServiceError("Automatizacion no encontrada para el cliente indicado.", 404);
  }

  return data;
}

async function getClienteCredenciales(clienteId) {
  const supabase = getBackendSupabaseClient();
  const { data, error } = await supabase
    .from("credenciales_cliente")
    .select("nombre, valor_encriptado, activo")
    .eq("cliente_id", clienteId)
    .eq("activo", true);

  if (error) {
    throw createServiceError(`No se pudieron obtener las credenciales: ${error.message}`);
  }

  const credenciales = {};

  for (const item of data || []) {
    credenciales[item.nombre] = desencriptar(item.valor_encriptado);
  }

  return credenciales;
}

async function registrarEjecucionService(automatizacion_id, estado, resultado, error_mensaje) {
  try {
    if (typeof automatizacion_id !== "string" || !automatizacion_id.trim()) {
      throw createServiceError("automatizacion_id es obligatorio.", 400);
    }

    const estadoNormalizado = typeof estado === "string" ? estado.trim() : "";

    if (!estadoNormalizado) {
      throw createServiceError("estado es obligatorio.", 400);
    }

    const supabase = getBackendSupabaseClient();
    const nowIso = new Date().toISOString();
    const executionPayload = {
      automatizacion_id: automatizacion_id.trim(),
      estado: estadoNormalizado,
      resultado: resultado == null ? null : JSON.stringify(resultado),
      error_mensaje: error_mensaje || null,
      fecha_ejecucion: nowIso,
    };
    const { data, error } = await supabase
      .from("ejecuciones")
      .insert(executionPayload)
      .select("*")
      .single();

    if (error || !data) {
      throw createServiceError(
        error && error.message
          ? `No se pudo registrar la ejecucion: ${error.message}`
          : "No se pudo registrar la ejecucion.",
      );
    }

    const { error: updateError } = await supabase
      .from("automatizaciones")
      .update({
        ultima_ejecucion: nowIso,
      })
      .eq("id", automatizacion_id.trim());

    if (updateError) {
      throw createServiceError(
        `La ejecucion se registro, pero no se pudo actualizar ultima_ejecucion: ${updateError.message}`,
      );
    }

    return data;
  } catch (error) {
    log("error", "registrarEjecucionService failed", {
      automatizacionId: automatizacion_id || null,
      error: error && error.message ? error.message : "unknown_error",
    });
    throw error;
  }
}

async function ejecutarWorkflowService(cliente_id, workflow_id, datos) {
  const startedAt = Date.now();

  try {
    if (typeof cliente_id !== "string" || !cliente_id.trim()) {
      throw createServiceError("cliente_id es obligatorio.", 400);
    }

    if (typeof workflow_id !== "string" || !workflow_id.trim()) {
      throw createServiceError("workflow_id es obligatorio.", 400);
    }

    const automatizacion = await getAutomatizacionByWorkflow(cliente_id, workflow_id);
    const credenciales = await getClienteCredenciales(cliente_id.trim());
    const payload = {
      datos: datos && typeof datos === "object" ? datos : {},
      credenciales,
    };
    const webhookUrl = `${getWebhookBaseUrl()}/cliente-${cliente_id.trim()}-${workflow_id.trim()}`;
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const duracionMs = Date.now() - startedAt;
    const responseText = await response.text();
    let resultado = responseText;

    try {
      resultado = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      resultado = responseText;
    }

    if (!response.ok) {
      await registrarEjecucionService(
        automatizacion.id,
        "error",
        resultado,
        `n8n respondio con HTTP ${response.status}.`,
      );

      const executionError = createServiceError(
        `El webhook de n8n devolvio HTTP ${response.status}.`,
        502,
      );
      executionError.executionLogged = true;
      throw executionError;
    }

    await registrarEjecucionService(automatizacion.id, "exito", resultado, null);

    return {
      resultado,
      duracion_ms: duracionMs,
    };
  } catch (error) {
    const duracionMs = Date.now() - startedAt;

    if (!error.executionLogged) {
      try {
        const automatizacion = await getAutomatizacionByWorkflow(cliente_id, workflow_id);
        await registrarEjecucionService(
          automatizacion.id,
          "error",
          null,
          error && error.message ? error.message : "unknown_error",
        );
      } catch (registrationError) {
        log("warn", "No se pudo registrar la ejecucion fallida", {
          clienteId: cliente_id || null,
          workflowId: workflow_id || null,
          error: registrationError && registrationError.message ? registrationError.message : "unknown_error",
        });
      }
    }

    log("error", "ejecutarWorkflowService failed", {
      clienteId: cliente_id || null,
      workflowId: workflow_id || null,
      duracionMs,
      error: error && error.message ? error.message : "unknown_error",
    });

    throw error;
  }
}

async function obtenerHistorialService(automatizacion_id, limit = 10) {
  try {
    if (typeof automatizacion_id !== "string" || !automatizacion_id.trim()) {
      throw createServiceError("automatizacion_id es obligatorio.", 400);
    }

    const normalizedLimit = Number.isInteger(limit) ? limit : Number.parseInt(limit, 10);
    const safeLimit = Number.isInteger(normalizedLimit) && normalizedLimit > 0 ? normalizedLimit : 10;
    const supabase = getBackendSupabaseClient();
    const { data, error } = await supabase
      .from("ejecuciones")
      .select("*")
      .eq("automatizacion_id", automatizacion_id.trim())
      .order("fecha_ejecucion", { ascending: false })
      .limit(safeLimit);

    if (error) {
      throw createServiceError(`No se pudo obtener el historial: ${error.message}`);
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    log("error", "obtenerHistorialService failed", {
      automatizacionId: automatizacion_id || null,
      error: error && error.message ? error.message : "unknown_error",
    });
    throw error;
  }
}

module.exports = {
  ejecutarWorkflowService,
  registrarEjecucionService,
  obtenerHistorialService,
};
