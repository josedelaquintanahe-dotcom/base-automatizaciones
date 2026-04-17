"use strict";

const { log } = require("../app/logger");
const { createSupabaseClient } = require("../clients/supabase.client");
const { dispatchOnboardingActivated } = require("./onboarding-dispatcher.service");
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

function normalizeClienteEstado(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
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

function buildOnboardingStatus({ cliente, activeCredentialCount, activeToken, latestInvoice }) {
  if (normalizeClienteEstado(cliente && cliente.estado) === "suspendido") {
    return "suspendido";
  }

  if (activeCredentialCount === 0 && !activeToken && !latestInvoice) {
    return "pendiente_configuracion";
  }

  if (activeCredentialCount > 0 && activeToken && latestInvoice) {
    return "listo_para_automatizar";
  }

  return "en_configuracion";
}

function buildAutomationReadiness({ cliente, activeCredentials, activeToken, latestInvoice }) {
  const clienteEstado = normalizeClienteEstado(cliente && cliente.estado);
  const checks = [
    {
      key: "cliente_activo",
      label: "Cliente operativo",
      ok: Boolean(cliente && cliente.estado && clienteEstado !== "suspendido"),
    },
    {
      key: "credenciales_activas",
      label: "Credenciales activas",
      ok: activeCredentials.length > 0,
    },
    {
      key: "token_operativo",
      label: "Token operativo activo",
      ok: Boolean(activeToken && activeToken.activo),
    },
    {
      key: "factura_inicial",
      label: "Factura inicial registrada",
      ok: Boolean(latestInvoice),
    },
  ];

  const missingRequirements = checks.filter((item) => !item.ok).map((item) => item.label);
  const ready = missingRequirements.length === 0;

  let nextRecommendedAction = "Validar workflow real de onboarding y conectar automatizaciones.";

  if (!checks[0].ok) {
    nextRecommendedAction = "Revisar el estado del cliente antes de activar automatizaciones.";
  } else if (!checks[1].ok) {
    nextRecommendedAction = "Completar y activar credenciales operativas del cliente.";
  } else if (!checks[2].ok) {
    nextRecommendedAction = "Emitir o reactivar un token operativo para el cliente.";
  } else if (!checks[3].ok) {
    nextRecommendedAction = "Registrar la factura inicial antes de automatizar el onboarding.";
  }

  return {
    ready,
    missing_requirements: missingRequirements,
    next_recommended_action: nextRecommendedAction,
    checks,
    available_context: {
      cliente_id: cliente.id,
      plan: cliente.plan,
      estado: cliente.estado || null,
      credenciales_tipos: activeCredentials.map((item) => item.tipo),
      token_operativo_activo: Boolean(activeToken && activeToken.activo),
      factura_inicial_estado: latestInvoice ? latestInvoice.estado || null : null,
    },
  };
}

function buildActivationSummary({ cliente, automationReadiness }) {
  const blockedReasons = Array.isArray(automationReadiness.missing_requirements)
    ? automationReadiness.missing_requirements
    : [];

  if (!automationReadiness.ready || blockedReasons.length > 0) {
    return {
      status: "blocked",
      can_activate: false,
      blocking_reasons: blockedReasons,
      operator_message: automationReadiness.next_recommended_action,
    };
  }

  return {
    status: "ready",
    can_activate: true,
    blocking_reasons: [],
    operator_message: "El cliente esta listo para activar onboarding desde backoffice.",
  };
}

async function obtenerClienteBackofficeService(cliente_id) {
  try {
    if (typeof cliente_id !== "string" || !cliente_id.trim()) {
      throw createServiceError("cliente_id es obligatorio.", 400);
    }

    const clienteId = cliente_id.trim();
    const supabase = getBackendSupabaseClient();
    const cliente = await obtenerClienteService(clienteId);

    const [{ data: credentialRows, error: credentialsError }, { data: tokenRows, error: tokensError }, { data: invoiceRows, error: invoicesError }] =
      await Promise.all([
        supabase
          .from("credenciales_cliente")
          .select("tipo, nombre, activo")
          .eq("cliente_id", clienteId),
        supabase
          .from("tokens")
          .select("id, activo, expiracion")
          .eq("cliente_id", clienteId)
          .order("expiracion", { ascending: false }),
        supabase
          .from("facturas")
          .select("mes, setup_inicial, mantenimiento_mensual, total, estado")
          .eq("cliente_id", clienteId)
          .order("mes", { ascending: false }),
      ]);

    if (credentialsError) {
      throw createServiceError(
        `No se pudo obtener el resumen de credenciales del cliente: ${credentialsError.message}`,
      );
    }

    if (tokensError) {
      throw createServiceError(`No se pudo obtener el resumen de tokens del cliente: ${tokensError.message}`);
    }

    if (invoicesError) {
      throw createServiceError(`No se pudo obtener el resumen de facturacion del cliente: ${invoicesError.message}`);
    }

    const credentials = Array.isArray(credentialRows) ? credentialRows : [];
    const activeCredentials = credentials.filter((item) => item.activo);
    const tokens = Array.isArray(tokenRows) ? tokenRows : [];
    const activeToken = tokens.find((item) => item.activo) || null;
    const invoices = Array.isArray(invoiceRows) ? invoiceRows : [];
    const latestInvoice = invoices[0] || null;
    const onboardingStatus = buildOnboardingStatus({
      cliente,
      activeCredentialCount: activeCredentials.length,
      activeToken,
      latestInvoice,
    });
    const automationReadiness = buildAutomationReadiness({
      cliente,
      activeCredentials,
      activeToken,
      latestInvoice,
    });

    return {
      cliente,
      operational_summary: {
        onboarding_status: onboardingStatus,
        credenciales: {
          total: credentials.length,
          activas: activeCredentials.length,
          tipos_configurados: [...new Set(activeCredentials.map((item) => item.tipo).filter(Boolean))],
          entradas: activeCredentials.map((item) => ({
            tipo: item.tipo || null,
            nombre: item.nombre || null,
            activo: Boolean(item.activo),
          })),
        },
        access: {
          token_operativo_activo: Boolean(activeToken && activeToken.activo),
          expiracion_token: activeToken ? activeToken.expiracion || null : null,
          total_tokens_registrados: tokens.length,
        },
        billing: {
          factura_inicial_emitida: Boolean(latestInvoice),
          ultima_factura: latestInvoice,
        },
        activation: buildActivationSummary({
          cliente,
          automationReadiness,
        }),
      },
      automation_readiness: automationReadiness,
    };
  } catch (error) {
    log("error", "obtenerClienteBackofficeService failed", {
      clienteId: cliente_id || null,
      error: error && error.message ? error.message : "unknown_error",
    });
    throw error;
  }
}

async function activarOnboardingBackofficeService(cliente_id, context = {}) {
  try {
    const clienteId = typeof cliente_id === "string" ? cliente_id.trim() : "";

    if (!clienteId) {
      throw createServiceError("cliente_id es obligatorio.", 400);
    }

    const attemptedAt = new Date().toISOString();
    const currentDetail = await obtenerClienteBackofficeService(clienteId);
    const activationSummary = currentDetail.operational_summary.activation;

    if (!activationSummary.can_activate) {
      log("warn", "Onboarding activation blocked", {
        correlationId: context.correlationId || null,
        clienteId,
        activationStatus: activationSummary.status,
        blockingReasons: activationSummary.blocking_reasons,
      });

      return {
        status: activationSummary.status === "activated" ? "already_activated" : "blocked",
        attempted_at: attemptedAt,
        correlation_id: context.correlationId || null,
        blocking_reasons: activationSummary.blocking_reasons,
        operator_message: activationSummary.operator_message,
        dispatch: {
          mode: "pending_integration",
          automated: false,
          target: "automatizacion_onboarding",
        },
        detail: currentDetail,
      };
    }

    const supabase = getBackendSupabaseClient();
    const activationDate = currentDetail.cliente.fecha_inicio || attemptedAt.slice(0, 10);
    const { error: updateError } = await supabase
      .from("clientes")
      .update({
        estado: "activo",
        fecha_inicio: activationDate,
      })
      .eq("id", clienteId);

    if (updateError) {
      throw createServiceError(`No se pudo activar el onboarding del cliente: ${updateError.message}`);
    }

    log("info", "Onboarding activation registered", {
      correlationId: context.correlationId || null,
      clienteId,
      activationDate,
    });

    const updatedDetail = await obtenerClienteBackofficeService(clienteId);
    const activationDetail = {
      ...updatedDetail,
      operational_summary: {
        ...updatedDetail.operational_summary,
        activation: {
          status: "activated",
          can_activate: false,
          blocking_reasons: [],
          operator_message: "Onboarding activado. Pendiente de conectar la automatizacion real.",
        },
      },
      automation_readiness: {
        ...updatedDetail.automation_readiness,
        next_recommended_action: "Onboarding activado. Pendiente de conectar el dispatcher real.",
      },
    };
    const dispatchResult = await dispatchOnboardingActivated({
      cliente: activationDetail.cliente,
      detail: activationDetail,
      attemptedAt,
      activationDate,
      context,
    });

    return {
      status: "activated",
      attempted_at: attemptedAt,
      correlation_id: context.correlationId || null,
      blocking_reasons: [],
      operator_message: "Onboarding activado. Pendiente de conectar la automatizacion real.",
      dispatch: dispatchResult.dispatch,
      detail: activationDetail,
    };
  } catch (error) {
    log("error", "activarOnboardingBackofficeService failed", {
      correlationId: context.correlationId || null,
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

    return Array.isArray(data)
      ? data.map((cliente) => ({
          id: cliente.id,
          nombre: cliente.nombre_empresa,
          email_contacto: cliente.email_contacto,
          created_at: cliente.created_at,
          estado: cliente.estado || null,
        }))
      : [];
  } catch (error) {
    log("error", "listarClientesService failed", {
      error: error && error.message ? error.message : "unknown_error",
    });
    throw error;
  }
}

module.exports = {
  activarOnboardingBackofficeService,
  crearClienteService,
  obtenerClienteBackofficeService,
  obtenerClienteService,
  listarClientesService,
};
