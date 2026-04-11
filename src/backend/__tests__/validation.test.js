"use strict";

const {
  validarEmail,
  validarPlan,
  validarOnboarding,
  validarToken,
} = require("../utils/validation");

// ─── validarEmail ─────────────────────────────────────────────────────────────

describe("validarEmail", () => {
  test("acepta un email con formato correcto", () => {
    expect(validarEmail("usuario@ejemplo.com").valido).toBe(true);
  });

  test("acepta email con subdominio", () => {
    expect(validarEmail("a@sub.dominio.org").valido).toBe(true);
  });

  test("acepta email con espacios alrededor (trim)", () => {
    expect(validarEmail("  usuario@ejemplo.com  ").valido).toBe(true);
  });

  test("rechaza email sin @", () => {
    expect(validarEmail("usuarioejemplo.com").valido).toBe(false);
  });

  test("rechaza email sin dominio", () => {
    expect(validarEmail("usuario@").valido).toBe(false);
  });

  test("rechaza email sin nombre de usuario", () => {
    expect(validarEmail("@ejemplo.com").valido).toBe(false);
  });

  test("rechaza cadena vacía", () => {
    expect(validarEmail("").valido).toBe(false);
  });

  test("rechaza null", () => {
    expect(validarEmail(null).valido).toBe(false);
  });

  test("rechaza number", () => {
    expect(validarEmail(42).valido).toBe(false);
  });

  test("rechaza undefined", () => {
    expect(validarEmail(undefined).valido).toBe(false);
  });
});

// ─── validarPlan ──────────────────────────────────────────────────────────────

describe("validarPlan", () => {
  test.each(["basico", "profesional", "empresarial"])(
    'acepta plan valido "%s"',
    (plan) => {
      expect(validarPlan(plan).valido).toBe(true);
    },
  );

  test("acepta plan con espacios alrededor (trim)", () => {
    expect(validarPlan("  basico  ").valido).toBe(true);
  });

  test("rechaza plan desconocido", () => {
    expect(validarPlan("premium").valido).toBe(false);
  });

  test("rechaza plan en mayúsculas", () => {
    expect(validarPlan("Basico").valido).toBe(false);
  });

  test("rechaza cadena vacía", () => {
    expect(validarPlan("").valido).toBe(false);
  });

  test("rechaza null", () => {
    expect(validarPlan(null).valido).toBe(false);
  });

  test("rechaza number", () => {
    expect(validarPlan(1).valido).toBe(false);
  });
});

// ─── validarOnboarding ────────────────────────────────────────────────────────

describe("validarOnboarding", () => {
  const datosValidos = {
    nombre_empresa: "Mi Empresa S.L.",
    email: "contacto@miempresa.com",
    plan: "basico",
    credenciales: { api_key: "abc123" },
  };

  test("valida un payload completo y correcto", () => {
    const { valido, errores } = validarOnboarding(datosValidos);
    expect(valido).toBe(true);
    expect(errores).toHaveLength(0);
  });

  test("rechaza nombre_empresa con menos de 3 caracteres", () => {
    const { valido, errores } = validarOnboarding({ ...datosValidos, nombre_empresa: "AB" });
    expect(valido).toBe(false);
    expect(errores.some((e) => e.includes("nombre_empresa"))).toBe(true);
  });

  test("rechaza nombre_empresa ausente", () => {
    const { valido, errores } = validarOnboarding({ ...datosValidos, nombre_empresa: undefined });
    expect(valido).toBe(false);
    expect(errores.some((e) => e.includes("nombre_empresa"))).toBe(true);
  });

  test("rechaza email con formato inválido", () => {
    const { valido, errores } = validarOnboarding({ ...datosValidos, email: "no-es-email" });
    expect(valido).toBe(false);
    expect(errores.some((e) => e.includes("email"))).toBe(true);
  });

  test("rechaza email ausente", () => {
    const { valido, errores } = validarOnboarding({ ...datosValidos, email: "" });
    expect(valido).toBe(false);
    expect(errores.some((e) => e.includes("email"))).toBe(true);
  });

  test("rechaza plan desconocido", () => {
    const { valido, errores } = validarOnboarding({ ...datosValidos, plan: "ultra" });
    expect(valido).toBe(false);
    expect(errores.some((e) => e.includes("plan"))).toBe(true);
  });

  test("rechaza credenciales vacías", () => {
    const { valido, errores } = validarOnboarding({ ...datosValidos, credenciales: {} });
    expect(valido).toBe(false);
    expect(errores.some((e) => e.includes("credenciales"))).toBe(true);
  });

  test("rechaza credenciales como array", () => {
    const { valido, errores } = validarOnboarding({ ...datosValidos, credenciales: ["a"] });
    expect(valido).toBe(false);
    expect(errores.some((e) => e.includes("credenciales"))).toBe(true);
  });

  test("acumula múltiples errores cuando hay varios campos inválidos", () => {
    const { valido, errores } = validarOnboarding({
      nombre_empresa: "X",
      email: "mal",
      plan: "raro",
      credenciales: {},
    });
    expect(valido).toBe(false);
    expect(errores.length).toBeGreaterThanOrEqual(3);
  });

  test("rechaza payload que no es objeto (array)", () => {
    const { valido } = validarOnboarding([datosValidos]);
    expect(valido).toBe(false);
  });

  test("rechaza payload null", () => {
    const { valido } = validarOnboarding(null);
    expect(valido).toBe(false);
  });
});

// ─── validarToken ─────────────────────────────────────────────────────────────

describe("validarToken", () => {
  test("acepta token alfanumérico de longitud suficiente", () => {
    expect(validarToken("client_abcdefghij1234567890abcd").valido).toBe(true);
  });

  test("acepta token con guiones bajos y guiones", () => {
    expect(validarToken("client_abc-XYZ_12345678901234").valido).toBe(true);
  });

  test("rechaza token con menos de 20 caracteres", () => {
    expect(validarToken("corto").valido).toBe(false);
  });

  test("rechaza token vacío", () => {
    expect(validarToken("").valido).toBe(false);
  });

  test("rechaza token con espacios", () => {
    expect(validarToken("client abcdefghijklmno").valido).toBe(false);
  });

  test("rechaza token con caracteres especiales no permitidos", () => {
    expect(validarToken("client@abc!def#ghijklmno").valido).toBe(false);
  });

  test("rechaza null", () => {
    expect(validarToken(null).valido).toBe(false);
  });

  test("rechaza number", () => {
    expect(validarToken(12345678901234567890).valido).toBe(false);
  });
});
