"use strict";

const { log } = require("../app/logger");
const { createSupabaseClient } = require("../clients/supabase.client");

const FRECUENCIAS_VALIDAS = new Set(["manual", "diaria", "semanal", "cada_hora"]);

function createServiceError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getBackendSupabaseClient() {
  return createSupabaseClient({ keyType: "service_role" });
}

async function ensureClienteExists(supabase, clienteId) {
  const { data, error } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .maybeSingle();

  if (error) {
    throw createServiceError(`No se pudo validar el cliente: ${error.message}`);
  }

  if (!data) {
    throw createServiceError("Cliente no encontrado.", 404);
  }
}

async function crearAutomatizacionService(cliente_id, datos) {
  try {
    if (typeof cliente_id !== "string" || !cliente_id.trim()) {
      throw createServiceError("cliente_id es obligatorio.", 400);
    }

    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
      throw createServiceError("datos debe ser un objeto valido.", 400);
    }

    const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
    const descripcion =
      typeof datos.descripcion === "string" && datos.descripcion.trim()
        ? datos.descripcion.trim()
        : null;
    const frecuencia =
      typeof datos.frecuencia === "string" && datos.frecuencia.trim()
        ? datos.frecuencia.trim()
        : null;

    if (!nombre) {
      throw createServiceError("nombre es obligatorio.", 400);
    }

    if (frecuencia && !FRECUENCIAS_VALIDAS.has(frecuencia)) {
      throw createServiceError("frecuencia debe ser manual, diaria, semanal o cada_hora.", 400);
    }

    const supabase = getBackendSupabaseClient();
    await ensureClienteExists(supabase, cliente_id.trim());

    const n8nWorkflowId = `pending_${Date.now()}`;
    const { data, error } = await supabase
      .from("automatizaciones")
      .insert({
        cliente_id: cliente_id.trim(),
        nombre,
        descripcion,
        frecuencia,
        n8n_workflow_id: n8nWorkflowId,
        estado: "activo",
      })
      .select("id, n8n_workflow_id")
      .single();

    if (error || !data) {
      throw createServiceError(
        error && error.message
          ? `No se pudo crear la automatizacion: ${error.message}`
          : "No se pudo crear la automatizacion.",
      );
    }

    return {
      automatizacion_id: data.id,
      n8n_workflow_id: data.n8n_workflow_id,
    };
  } catch (error) {
    log("error", "crearAutomatizacionService failed", {
      clienteId: cliente_id || null,
      error: error && error.message ? error.message : "unknown_error",
    });
    throw error;
  }
}

async function obtenerAutomatizacionesService(cliente_id) {
  try {
    if (typeof cliente_id !== "string" || !cliente_id.trim()) {
      throw createServiceError("cliente_id es obligatorio.", 400);
    }

    const supabase = getBackendSupabaseClient();
    const { data, error } = await supabase
      .from("automatizaciones")
      .select(
        "id, cliente_id, nombre, descripcion, n8n_workflow_id, estado, frecuencia, ultima_ejecucion, proxima_ejecucion, created_at, updated_at",
      )
      .eq("cliente_id", cliente_id.trim())
      .order("created_at", { ascending: false });

    if (error) {
      throw createServiceError(`No se pudieron obtener las automatizaciones: ${error.message}`);
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    log("error", "obtenerAutomatizacionesService failed", {
      clienteId: cliente_id || null,
      error: error && error.message ? error.message : "unknown_error",
    });
    throw error;
  }
}

async function pausarAutomatizacionService(automatizacion_id) {
  try {
    if (typeof automatizacion_id !== "string" || !automatizacion_id.trim()) {
      throw createServiceError("automatizacion_id es obligatorio.", 400);
    }

    const supabase = getBackendSupabaseClient();
    const { data, error } = await supabase
      .from("automatizaciones")
      .update({
        estado: "pausado",
      })
      .eq("id", automatizacion_id.trim())
      .select("id, estado")
      .maybeSingle();

    if (error) {
      throw createServiceError(`No se pudo pausar la automatizacion: ${error.message}`);
    }

    if (!data) {
      throw createServiceError("Automatizacion no encontrada.", 404);
    }

    return {
      automatizacion_id: data.id,
      estado: data.estado,
      pausada: true,
    };
  } catch (error) {
    log("error", "pausarAutomatizacionService failed", {
      automatizacionId: automatizacion_id || null,
      error: error && error.message ? error.message : "unknown_error",
    });
    throw error;
  }
}

module.exports = {
  crearAutomatizacionService,
  obtenerAutomatizacionesService,
  pausarAutomatizacionService,
};
