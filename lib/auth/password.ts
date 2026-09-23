import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

/** Gera "salt:hash" (ambos hex) — usado tanto pra senha do ligador quanto pro PIN do admin. */
export async function hashSegredo(segredoEmTexto: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(segredoEmTexto, salt, KEYLEN)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/** Compara em tempo constante — evita timing attack no login. */
export async function verificarSegredo(
  segredoEmTexto: string,
  hashArmazenado: string,
): Promise<boolean> {
  const [salt, hashHex] = hashArmazenado.split(":");
  if (!salt || !hashHex) return false;
  const hashArmazenadoBuf = Buffer.from(hashHex, "hex");
  const derivedKey = (await scryptAsync(segredoEmTexto, salt, KEYLEN)) as Buffer;
  if (derivedKey.length !== hashArmazenadoBuf.length) return false;
  return timingSafeEqual(derivedKey, hashArmazenadoBuf);
}
