"use strict";

const { log } = require("../app/logger");
const { triggerN8nWebhookPath } = require("../clients/n8n.client");
const { createSupabaseClient } = require("../clients/supabase.client");
const { obtenerClienteBackofficeService } = require("./cliente.service");

function createServiceError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getBackendSupabaseClient() {
  return createSupabaseClient({ keyType: "service_role" });
}

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
}

async function getAutomatizacionByWorkflow(clienteId, workflowId) {
  const supabase = getBackendSupabaseClient();
  const normalizedClienteId = clienteId.trim();
  const normalizedWorkflowId = workflowId.trim();
  let query = supabase
    .from("automatizaciones")
    .select("id, cliente_id, nombre, n8n_workflow_id, estado")
    .eq("cliente_id", normalizedClienteId);

  if (isUuidLike(normalizedWorkflowId)) {
    query = query.or(`id.eq.${normalizedWorkflowId},n8n_workflow_id.eq.${normalizedWorkflowId}`);
  } else {
    query = query.eq("n8n_workflow_id", normalizedWorkflowId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw createServiceError(`No se pudo localizar la automatizacion: ${error.message}`);
  }

  if (!data) {
    throw createServiceError("Automatizacion no encontrada para el cliente indicado.", 404);
  }

  return data;
}

function buildSanitizedExecutionPayload({
  automatizacion,
  clienteDetail,
  clienteId,
  workflowId,
  datos,
  context,
}) {
  const automationReadiness = clienteDetail && clienteDetail.automation_readiness
    ? {
        ready: Boolean(clienteDetail.automation_readiness.ready),
        missing_requirements: Array.isArray(clienteDetail.automation_readiness.missing_requirements)
          ? clienteDetail.automation_readiness.missing_requirements
          : [],
        next_recommended_action: clienteDetail.automation_readiness.next_recommended_action || null,
      }
    : null;

  return {
    correlation_id: context.correlationId || null,
    cliente_id: clienteId,
    automation_id: automatizacion.id,
    workflow_id: workflowId,
    workflow_name: automatizacion.n8n_workflow_id,
    automation_name: automatizacion.nombre,
    trigger_source: context.triggerSource || "cliente_api",
    execution_requested_at: new Date().toISOString(),
    request_payload: datos && typeof datos === "object" && !Array.isArray(datos) ? datos : {},
    client_snapshot: clienteDetail
      ? {
          cliente: clienteDetail.cliente
            ? {
                id: clienteDetail.cliente.id,
                nombre_empresa: clienteDetail.cliente.nombre_empresa,
                plan: clienteDetail.cliente.plan,
                estado: clienteDetail.cliente.estado || null,
              }
            : null,
          operational_summary: clienteDetail.operational_summary || null,
          automation_readiness: automationReadiness,
        }
      : null,
  };
}

async function registrarEjecucionService(
  automatizacion_id,
  estado,
  resultado,
  error_mensaje,
  duracion_ms = null,
) {
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
      duracion_ms: Number.isInteger(duracion_ms) && duracion_ms >= 0 ? duracion_ms : null,
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

async function ejecutarWorkflowService(cliente_id, workflow_id, datos, context = {}) {
  const startedAt = Date.now();

  try {
    if (typeof cliente_id !== "string" || !cliente_id.trim()) {
      throw createServiceError("cliente_id es obligatorio.", 400);
    }

    if (typeof workflow_id !== "string" || !workflow_id.trim()) {
      throw createServiceError("workflow_id es obligatorio.", 400);
    }

    const automatizacion = await getAutomatizacionByWorkflow(cliente_id, workflow_id);
    const clienteDetail = await obtenerClienteBackofficeService(cliente_id.trim());

    if (automatizacion.estado !== "activo") {
      throw createServiceError("La automatizacion no esta activa.", 409);
    }

    const payload = buildSanitizedExecutionPayload({
      automatizacion,
      clienteDetail,
      clienteId: cliente_id.trim(),
      workflowId: workflow_id.trim(),
      datos,
      context,
    });
    const response = await triggerN8nWebhookPath({
      path: automatizacion.n8n_workflow_id,
      payload,
    });
    const duracionMs = Date.now() - startedAt;
    const resultado = response.data;

    if (!response.ok) {
      await registrarEjecucionService(
        automatizacion.id,
        "error",
        resultado,
        `n8n respondio con HTTP ${response.status}.`,
        duracionMs,
      );

      const executionError = createServiceError(
        `El webhook de n8n devolvio HTTP ${response.status}.`,
        502,
      );
      executionError.executionLogged = true;
      throw executionError;
    }

    await registrarEjecucionService(automatizacion.id, "exito", resultado, null, duracionMs);

    return {
      correlation_id: payload.correlation_id,
      automatizacion_id: automatizacion.id,
      workflow_target: automatizacion.n8n_workflow_id,
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
          duracionMs,
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
