"use strict";

const { encriptar, desencriptar, hashToken, generarToken } = require("../utils/encryption");

const TEST_KEY = "clave-secreta-para-pruebas-unitarias-1234";

beforeEach(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

afterEach(() => {
  delete process.env.ENCRYPTION_KEY;
});

// ─── encriptar / desencriptar ─────────────────────────────────────────────────

describe("encriptar y desencriptar", () => {
  test("el roundtrip recupera el valor original", () => {
    const original = "mi-secreto-seguro";
    expect(desencriptar(encriptar(original))).toBe(original);
  });

  test("cifra cadenas largas sin pérdida", () => {
    const original = "a".repeat(500);
    expect(desencriptar(encriptar(original))).toBe(original);
  });

  test("cifra cadenas con caracteres especiales y Unicode", () => {
    const original = "¡Hola Ñoño! @#$% 中文 🚀";
    expect(desencriptar(encriptar(original))).toBe(original);
  });

  test("cada llamada a encriptar produce un resultado diferente (IV aleatorio)", () => {
    const valor = "mismo-valor";
    expect(encriptar(valor)).not.toBe(encriptar(valor));
  });

  test("el resultado tiene formato ivHex:encryptedHex", () => {
    const resultado = encriptar("prueba");
    const partes = resultado.split(":");
    expect(partes).toHaveLength(2);
    expect(partes[0]).toMatch(/^[0-9a-f]{32}$/); // IV de 16 bytes = 32 hex chars
    expect(partes[1]).toMatch(/^[0-9a-f]+$/);
  });

  test("encriptar lanza TypeError si el valor no es string", () => {
    expect(() => encriptar(123)).toThrow(TypeError);
    expect(() => encriptar(null)).toThrow(TypeError);
    expect(() => encriptar(undefined)).toThrow(TypeError);
  });

  test("encriptar lanza Error si el valor es cadena vacía", () => {
    expect(() => encriptar("")).toThrow(/vacio/i);
  });

  test("encriptar lanza Error si falta ENCRYPTION_KEY", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encriptar("algo")).toThrow(/ENCRYPTION_KEY/);
  });
});

describe("desencriptar", () => {
  test("lanza Error con formato incorrecto (sin ':')", () => {
    expect(() => desencriptar("hexsinformat")).toThrow(/formato/i);
  });

  test("lanza Error si hay más de un ':' (partes extra)", () => {
    expect(() => desencriptar("a:b:c")).toThrow(/formato/i);
  });

  test("lanza Error si el IV no tiene la longitud correcta", () => {
    // IV válido debe ser 32 hex chars; aquí ponemos uno corto
    expect(() => desencriptar("aabbcc:deadbeef1234")).toThrow(/IV/i);
  });

  test("lanza Error si los datos están corruptos", () => {
    const cifrado = encriptar("original");
    const [ivHex] = cifrado.split(":");
    expect(() => desencriptar(`${ivHex}:ffffffffffffffffffffffff`)).toThrow();
  });

  test("lanza Error si el valor no es string", () => {
    expect(() => desencriptar(null)).toThrow(TypeError);
    expect(() => desencriptar(42)).toThrow(TypeError);
  });

  test("lanza Error si el valor es cadena vacía", () => {
    expect(() => desencriptar("")).toThrow(/vacio/i);
  });

  test("lanza Error si falta ENCRYPTION_KEY al desencriptar", () => {
    const cifrado = encriptar("valor");
    delete process.env.ENCRYPTION_KEY;
    expect(() => desencriptar(cifrado)).toThrow(/ENCRYPTION_KEY/);
  });
});

// ─── hashToken ────────────────────────────────────────────────────────────────

describe("hashToken", () => {
  test("produce un hash hex de 64 caracteres (SHA-256)", () => {
    const hash = hashToken("mi-token-de-prueba");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test("es determinista: el mismo input produce el mismo hash", () => {
    const token = "token-consistente-12345";
    expect(hashToken(token)).toBe(hashToken(token));
  });

  test("tokens distintos producen hashes distintos", () => {
    expect(hashToken("token-a-123456")).not.toBe(hashToken("token-b-123456"));
  });

  test("lanza TypeError si el token no es string", () => {
    expect(() => hashToken(null)).toThrow(TypeError);
    expect(() => hashToken(undefined)).toThrow(TypeError);
    expect(() => hashToken(123)).toThrow(TypeError);
  });

  test("lanza Error si el token es cadena vacía", () => {
    expect(() => hashToken("")).toThrow(/vacio/i);
  });
});

// ─── generarToken ─────────────────────────────────────────────────────────────

describe("generarToken", () => {
  test("genera un token con prefijo 'client_'", () => {
    expect(generarToken()).toMatch(/^client_/);
  });

  test("genera tokens únicos en cada llamada", () => {
    const tokens = Array.from({ length: 10 }, () => generarToken());
    const unicos = new Set(tokens);
    expect(unicos.size).toBe(10);
  });

  test("el token tiene longitud suficiente (> 20 caracteres)", () => {
    expect(generarToken().length).toBeGreaterThan(20);
  });

  test("el token sólo contiene caracteres alfanuméricos y '_'", () => {
    // 'client_' + hex de 24 bytes = 48 chars hex
    expect(generarToken()).toMatch(/^client_[0-9a-f]+$/);
  });
});
