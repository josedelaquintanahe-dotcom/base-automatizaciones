"use strict";

const { log } = require("../app/logger");
const { createSupabaseClient } = require("../clients/supabase.client");
const { encriptar, generarToken, hashToken } = require("../utils/encryption");
const { validarOnboarding } = require("../utils/validation");

const PLAN_PRICING = {
  basico: {
    setup_inicial: 300,
    mantenimiento_mensual: 99,
  },
  profesional: {
    setup_inicial: 800,
    mantenimiento_mensual: 299,
  },
  empresarial: {
    setup_inicial: 2000,
    mantenimiento_mensual: 999,
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

function getFutureDateIso(daysToAdd) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

function getCurrentMonthDateIso() {
  return new Date().toISOString().slice(0, 10);
}

function deriveCredentialMetadata(rawKey) {
  const normalizedKey = String(rawKey || "").trim();
  const normalizedType = normalizedKey
    .toLowerCase()
    .split(/[_-]/)
    .filter(Boolean)[0] || "general";

  return {
    tipo: normalizedType,
    nombre: normalizedKey || "credencial",
  };
}

async function crearClienteService(datos) {
  try {
    const validation = validarOnboarding(datos);

    if (!validation.valido) {
      throw createServiceError(`Datos de onboarding invalidos: ${validation.errores.join(" ")}`, 400);
    }

    const pricing = PLAN_PRICING[datos.plan.trim()];
    const supabase = getBackendSupabaseClient();
    const normalizedEmail = datos.email.trim().toLowerCase();
    const telefono = typeof datos.telefono === "string" ? datos.telefono.trim() : null;
    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .insert({
        nombre_empresa: datos.nombre_empresa.trim(),
        email_contacto: normalizedEmail,
        telefono: telefono || null,
        plan: datos.plan.trim(),
        precio_mensual: pricing.mantenimiento_mensual,
      })
      .select("id")
      .single();

    if (clienteError || !cliente) {
      throw createServiceError(
        clienteError && clienteError.message
          ? `No se pudo crear el cliente: ${clienteError.message}`
          : "No se pudo crear el cliente.",
      );
    }

    const credentialRows = Object.entries(datos.credenciales).map(([key, value]) => {
      const metadata = deriveCredentialMetadata(key);

      return {
        cliente_id: cliente.id,
        tipo: metadata.tipo,
        nombre: metadata.nombre,
        valor_encriptado: encriptar(String(value)),
        activo: true,
      };
    });

    if (credentialRows.length > 0) {
      const { error: credencialesError } = await supabase
        .from("credenciales_cliente")
        .insert(credentialRows);

      if (credencialesError) {
        throw createServiceError(
          `No se pudieron guardar las credenciales del cliente: ${credencialesError.message}`,
        );
      }
    }

    const token = generarToken();
    const tokenHash = hashToken(token);
    const expiracion = getFutureDateIso(365);
    const { error: tokenError } = await supabase
      .from("tokens")
      .insert({
        cliente_id: cliente.id,
        token_hash: tokenHash,
        activo: true,
        expiracion,
      });

    if (tokenError) {
      throw createServiceError(`No se pudo crear el token del cliente: ${tokenError.message}`);
    }

    const facturaPayload = {
      cliente_id: cliente.id,
      mes: getCurrentMonthDateIso(),
      setup_inicial: pricing.setup_inicial,
      mantenimiento_mensual: pricing.mantenimiento_mensual,
      total: pricing.setup_inicial + pricing.mantenimiento_mensual,
      estado: "pendiente",
    };
    const { error: facturaError } = await supabase.from("facturas").insert(facturaPayload);

    if (facturaError) {
      throw createServiceError(`No se pudo crear la factura inicial: ${facturaError.message}`);
    }

    return {
      cliente_id: cliente.id,
      token,
      setup_inicial: pricing.setup_inicial,
      mantenimiento_mensual: pricing.mantenimiento_mensual,
    };
  } catch (error) {
    log("error", "crearClienteService failed", {
      error: error && error.message ? error.message : "unknown_error",
    });
    throw error;
  }
}

async function obtenerClienteService(cliente_id) {
  try {
    if (typeof cliente_id !== "string" || !cliente_id.trim()) {
      throw createServiceError("cliente_id es obligatorio.", 400);
    }

    const supabase = getBackendSupabaseClient();
    const { data, error } = await supabase
      .from("clientes")
      .select(
        "id, nombre_empresa, email_contacto, telefono, plan, estado, fecha_inicio, precio_mensual, created_at, updated_at",
      )
      .eq("id", cliente_id.trim())
      .maybeSingle();

    if (error) {
      throw createServiceError(`No se pudo obtener el cliente: ${error.message}`);
    }

    if (!data) {
      throw createServiceError("Cliente no encontrado.", 404);
    }

    return data;
  } catch (error) {
    log("error", "obtenerClienteService failed", {
      clienteId: cliente_id || null,
      error: error && error.message ? error.message : "unknown_error",
    });
    throw error;
  }
}

async function listarClientesService() {
  try {
    const supabase = getBackendSupabaseClient();
    const { data, error } = await supabase
      .from("clientes")
      .select(
        "id, nombre_empresa, email_contacto, telefono, plan, estado, fecha_inicio, precio_mensual, created_at, updated_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw createServiceError(`No se pudieron listar los clientes: ${error.message}`);
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    log("error", "listarClientesService failed", {
      error: error && error.message ? error.message : "unknown_error",
    });
    throw error;
  }
}

module.exports = {
  crearClienteService,
  obtenerClienteService,
  listarClientesService,
};
