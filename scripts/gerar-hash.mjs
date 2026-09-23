// Gera o hash "salt:hash" pra colar no ADMIN_PIN_HASH (ou numa senha de ligador).
// Usa o mesmo algoritmo de lib/auth/password.ts — se mudar um, mude o outro.
//
// Uso: node scripts/gerar-hash.js 123456

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const segredo = process.argv[2];
if (!segredo) {
  console.error("Uso: node scripts/gerar-hash.js <pin-ou-senha>");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const derivedKey = await scryptAsync(segredo, salt, 64);
console.log(`${salt}:${derivedKey.toString("hex")}`);
