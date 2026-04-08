"use strict";

const crypto = require("crypto");

const AES_ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const TOKEN_PREFIX = "client_";
const TOKEN_RANDOM_BYTES = 24;

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string") {
    throw new TypeError(`${fieldName} debe ser un string.`);
  }

  if (!value.trim()) {
    throw new Error(`${fieldName} no puede estar vacio.`);
  }
}

function getEncryptionMaterial() {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (typeof encryptionKey !== "string" || !encryptionKey.trim()) {
    throw new Error(
      "Configuracion incompleta: falta ENCRYPTION_KEY para operaciones de cifrado.",
    );
  }

  // Deriva una clave de 32 bytes estable usando SHA-256 sobre el secreto base.
  return crypto.createHash("sha256").update(encryptionKey, "utf8").digest();
}

function encriptar(valor) {
  assertNonEmptyString(valor, "valor");

  const key = getEncryptionMaterial();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(valor, "utf8"), cipher.final()]);

  // El formato de salida combina IV y contenido cifrado para permitir descifrado posterior.
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function desencriptar(valorEncriptado) {
  assertNonEmptyString(valorEncriptado, "valorEncriptado");

  const [ivHex, encryptedHex, ...extraParts] = valorEncriptado.split(":");

  if (!ivHex || !encryptedHex || extraParts.length > 0) {
    throw new Error("valorEncriptado no tiene el formato esperado ivHex:encryptedHex.");
  }

  if (ivHex.length !== IV_LENGTH * 2) {
    throw new Error("valorEncriptado no contiene un IV valido.");
  }

  const key = getEncryptionMaterial();

  try {
    const iv = Buffer.from(ivHex, "hex");
    const encryptedContent = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedContent),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    throw new Error("No se pudo desencriptar el valor proporcionado.");
  }
}

function hashToken(token) {
  assertNonEmptyString(token, "token");

  // El hash hex permite almacenar comparaciones seguras sin persistir el token original.
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

function generarToken() {
  // Genera un token legible con prefijo estable y suficiente entropia para uso backend.
  const randomPart = crypto.randomBytes(TOKEN_RANDOM_BYTES).toString("hex");
  return `${TOKEN_PREFIX}${randomPart}`;
}

module.exports = {
  encriptar,
  desencriptar,
  hashToken,
  generarToken,
};
