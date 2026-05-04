"use strict";

const { log } = require("../app/logger");
const { createSupabaseClient } = require("../clients/supabase.client");

const FRECUENCIAS_VALIDAS = new Set(["manual", "diaria", "semanal", "cada_hora"]);
const BASE_AUTOMATION_TEMPLATES = {
  client_health_snapshot: {
    template_key: "client_health_snapshot",
    nombre: "Snapshot sanitario del cliente",
    descripcion:
      "Genera un resumen sanitario interno del estado operativo del cliente y de su base de automatizacion.",
    frecuencia: "manual",
    n8n_workflow_id: "automation_client_health_snapshot",
    estado: "activo",
  },
  client_next_actions_brief: {
    template_key: "client_next_actions_brief",
    nombre: "Brief operativo de siguientes pasos",
    descripcion:
      "Genera un brief interno priorizado con los siguientes pasos recomendados para el cliente ya preparado para automatizacion.",
    frecuencia: "manual",
    n8n_workflow_id: "automation_client_next_actions_brief",
    estado: "activo",
  },
  client_first_run_handoff: {
    template_key: "client_first_run_handoff",
    nombre: "Handoff operativo de primer arranque",
    descripcion:
      "Genera un paquete operativo interno para preparar la primera ejecucion real controlada del cliente.",
    frecuencia: "manual",
    n8n_workflow_id: "automation_client_first_run_handoff",
    estado: "activo",
  },
  client_controlled_run_stage: {
    template_key: "client_controlled_run_stage",
    nombre: "Staging de ejecucion controlada",
    descripcion:
      "Programa de forma controlada la primera ejecucion operativa de una automatizacion objetivo ya existente del cliente.",
    frecuencia: "manual",
    n8n_workflow_id: "automation_client_controlled_run_stage",
    estado: "activo",
  },
  client_invoice_draft_create: {
    template_key: "client_invoice_draft_create",
    nombre: "Creacion de borrador de factura mensual",
    descripcion:
      "Crea un borrador mensual de facturacion para el cliente usando solo contexto sanitario y con rollback controlado.",
    frecuencia: "manual",
    n8n_workflow_id: "automation_client_invoice_draft_create",
    estado: "activo",
  },
};

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

function getBaseAutomationTemplate(templateKey) {
  const normalizedKey = typeof templateKey === "string" ? templateKey.trim() : "";
  const template = BASE_AUTOMATION_TEMPLATES[normalizedKey];

  if (!template) {
    throw createServiceError("template no soportado para provisionado base.", 400);
  }

  return template;
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

async function provisionarAutomatizacionBaseService(cliente_id, templateKey = "client_health_snapshot") {
  try {
    if (typeof cliente_id !== "string" || !cliente_id.trim()) {
      throw createServiceError("cliente_id es obligatorio.", 400);
    }

    const clienteId = cliente_id.trim();
    const template = getBaseAutomationTemplate(templateKey);
    const supabase = getBackendSupabaseClient();

    await ensureClienteExists(supabase, clienteId);

    const { data: existingRow, error: existingError } = await supabase
      .from("automatizaciones")
      .select("id, cliente_id, nombre, descripcion, n8n_workflow_id, estado, frecuencia")
      .eq("cliente_id", clienteId)
      .eq("n8n_workflow_id", template.n8n_workflow_id)
      .maybeSingle();

    if (existingError) {
      throw createServiceError(
        `No se pudo validar la automatizacion base existente: ${existingError.message}`,
      );
    }

    if (existingRow) {
      return {
        created: false,
        template_key: template.template_key,
        automatizacion: existingRow,
      };
    }

    const { data, error } = await supabase
      .from("automatizaciones")
      .insert({
        cliente_id: clienteId,
        nombre: template.nombre,
        descripcion: template.descripcion,
        frecuencia: template.frecuencia,
        n8n_workflow_id: template.n8n_workflow_id,
        estado: template.estado,
      })
      .select("id, cliente_id, nombre, descripcion, n8n_workflow_id, estado, frecuencia")
      .single();

    if (error || !data) {
      throw createServiceError(
        error && error.message
          ? `No se pudo provisionar la automatizacion base: ${error.message}`
          : "No se pudo provisionar la automatizacion base.",
      );
    }

    return {
      created: true,
      template_key: template.template_key,
      automatizacion: data,
    };
  } catch (error) {
    log("error", "provisionarAutomatizacionBaseService failed", {
      clienteId: cliente_id || null,
      templateKey: templateKey || null,
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
  BASE_AUTOMATION_TEMPLATES,
  crearAutomatizacionService,
  obtenerAutomatizacionesService,
  pausarAutomatizacionService,
  provisionarAutomatizacionBaseService,
};
