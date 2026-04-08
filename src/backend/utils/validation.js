"use strict";

const PLANES_VALIDOS = new Set(["basico", "profesional", "empresarial"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_REGEX = /^[A-Za-z0-9_-]+$/;

function validarEmail(email) {
  const valido = typeof email === "string" && EMAIL_REGEX.test(email.trim());

  return {
    valido,
  };
}

function validarPlan(plan) {
  const normalizedPlan = typeof plan === "string" ? plan.trim() : "";

  return {
    valido: PLANES_VALIDOS.has(normalizedPlan),
  };
}

function validarOnboarding(datos) {
  const errores = [];
  const payload = datos && typeof datos === "object" && !Array.isArray(datos) ? datos : {};
  const nombreEmpresa =
    typeof payload.nombre_empresa === "string" ? payload.nombre_empresa.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const plan = typeof payload.plan === "string" ? payload.plan.trim() : "";
  const credenciales =
    payload.credenciales && typeof payload.credenciales === "object" && !Array.isArray(payload.credenciales)
      ? payload.credenciales
      : null;

  if (!nombreEmpresa || nombreEmpresa.length < 3) {
    errores.push("nombre_empresa es obligatorio y debe tener al menos 3 caracteres.");
  }

  if (!email) {
    errores.push("email es obligatorio.");
  } else if (!validarEmail(email).valido) {
    errores.push("email no tiene un formato valido.");
  }

  if (!plan) {
    errores.push("plan es obligatorio.");
  } else if (!validarPlan(plan).valido) {
    errores.push("plan debe ser basico, profesional o empresarial.");
  }

  if (!credenciales || Object.keys(credenciales).length === 0) {
    errores.push("credenciales debe ser un objeto no vacio con al menos una clave.");
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

function validarToken(token) {
  const normalizedToken = typeof token === "string" ? token.trim() : "";
  const valido =
    normalizedToken.length >= 20 && TOKEN_REGEX.test(normalizedToken);

  return {
    valido,
  };
}

module.exports = {
  validarEmail,
  validarPlan,
  validarOnboarding,
  validarToken,
};
