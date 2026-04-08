"use strict";

const { log } = require("../app/logger");
const { createSupabaseClient } = require("../clients/supabase.client");
const { hashToken } = require("../utils/encryption");
const { validarToken } = require("../utils/validation");

function buildUnauthorizedResponse(res, message) {
  return res.status(401).json({
    success: false,
    error: message,
  });
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function isTokenExpired(expiracion) {
  if (!expiracion) {
    return false;
  }

  return expiracion < getTodayDateString();
}

function getTokenFingerprint(tokenHash) {
  return typeof tokenHash === "string" ? tokenHash.slice(0, 12) : "unknown_token";
}

async function getClienteFromToken(token) {
  try {
    if (!validarToken(token).valido) {
      return null;
    }

    const tokenHash = hashToken(token);
    const supabase = createSupabaseClient({ keyType: "service_role" });
    const { data, error } = await supabase
      .from("tokens")
      .select("id, cliente_id, activo, expiracion")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    if (!data.activo || isTokenExpired(data.expiracion)) {
      return null;
    }

    return data.cliente_id || null;
  } catch (error) {
    return null;
  }
}

async function authMiddleware(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      log("warn", "Authentication failed: missing Authorization header", {
        correlationId: req.correlationId || null,
        path: req.originalUrl,
      });

      return buildUnauthorizedResponse(res, "Authorization header requerido.");
    }

    const authorizationParts = authorizationHeader.split(" ");

    if (
      authorizationParts.length !== 2 ||
      authorizationParts[0] !== "Bearer" ||
      !authorizationParts[1]
    ) {
      log("warn", "Authentication failed: invalid Authorization header format", {
        correlationId: req.correlationId || null,
        path: req.originalUrl,
      });

      return buildUnauthorizedResponse(res, "Formato de Authorization invalido.");
    }

    const token = authorizationParts[1].trim();

    if (!validarToken(token).valido) {
      log("warn", "Authentication failed: token format rejected", {
        correlationId: req.correlationId || null,
        path: req.originalUrl,
      });

      return buildUnauthorizedResponse(res, "Token invalido.");
    }

    const tokenHash = hashToken(token);
    const tokenFingerprint = getTokenFingerprint(tokenHash);
    const supabase = createSupabaseClient({ keyType: "service_role" });
    const { data, error } = await supabase
      .from("tokens")
      .select("id, cliente_id, activo, expiracion")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error || !data) {
      log("warn", "Authentication failed: token not found", {
        correlationId: req.correlationId || null,
        path: req.originalUrl,
        tokenFingerprint,
      });

      return buildUnauthorizedResponse(res, "Token invalido.");
    }

    if (!data.activo) {
      log("warn", "Authentication failed: inactive token", {
        correlationId: req.correlationId || null,
        path: req.originalUrl,
        tokenFingerprint,
        tokenId: data.id,
        clienteId: data.cliente_id,
      });

      return buildUnauthorizedResponse(res, "Token inactivo.");
    }

    if (isTokenExpired(data.expiracion)) {
      log("warn", "Authentication failed: expired token", {
        correlationId: req.correlationId || null,
        path: req.originalUrl,
        tokenFingerprint,
        tokenId: data.id,
        clienteId: data.cliente_id,
        expiracion: data.expiracion,
      });

      return buildUnauthorizedResponse(res, "Token expirado.");
    }

    req.cliente_id = data.cliente_id;
    req.auth = {
      cliente_id: data.cliente_id,
      token_id: data.id,
    };

    return next();
  } catch (error) {
    log("error", "Authentication middleware error", {
      correlationId: req.correlationId || null,
      path: req.originalUrl,
      error: error && error.message ? error.message : "unknown_error",
    });

    return res.status(500).json({
      success: false,
      error: "No se pudo validar la autenticacion.",
    });
  }
}

module.exports = {
  authMiddleware,
  getClienteFromToken,
};
