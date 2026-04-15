"use strict";

const crypto = require("crypto");

const { log } = require("../app/logger");

function buildUnauthorizedResponse(res, message) {
  return res.status(401).json({
    success: false,
    error: message,
  });
}

function buildServiceUnavailableResponse(res) {
  return res.status(503).json({
    success: false,
    error: "Backoffice no configurado en este entorno.",
  });
}

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const authorizationParts = authorizationHeader.split(" ");

  if (
    authorizationParts.length !== 2 ||
    authorizationParts[0] !== "Bearer" ||
    !authorizationParts[1]
  ) {
    return null;
  }

  return authorizationParts[1].trim();
}

function secureEquals(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function backofficeAuthMiddleware(req, res, next) {
  const expectedToken = process.env.BACKOFFICE_API_TOKEN;

  if (typeof expectedToken !== "string" || expectedToken.trim().length === 0) {
    log("error", "Backoffice authentication not configured", {
      correlationId: req.correlationId || null,
      path: req.originalUrl,
    });

    return buildServiceUnavailableResponse(res);
  }

  const providedToken = extractBearerToken(req.headers.authorization);

  if (!providedToken) {
    log("warn", "Backoffice authentication failed: missing or invalid Authorization header", {
      correlationId: req.correlationId || null,
      path: req.originalUrl,
    });

    return buildUnauthorizedResponse(
      res,
      "Authorization de backoffice requerida con formato Bearer.",
    );
  }

  if (!secureEquals(providedToken, expectedToken.trim())) {
    log("warn", "Backoffice authentication failed: invalid token", {
      correlationId: req.correlationId || null,
      path: req.originalUrl,
    });

    return buildUnauthorizedResponse(res, "Token de backoffice invalido.");
  }

  req.backoffice = {
    role: "internal_backoffice",
  };

  return next();
}

module.exports = {
  backofficeAuthMiddleware,
};
