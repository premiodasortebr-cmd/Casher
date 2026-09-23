// Aplica as migrations pendentes usando DATABASE_URL (lida de .env.local no dev,
// das env vars do Render em produção).
//
//   node scripts/migrate.mjs                  -> falha se DATABASE_URL faltar
//   node scripts/migrate.mjs --if-configured  -> só avisa e segue (predev / start)
//
// Com --if-configured, falha de CONEXÃO só avisa (o schema quase sempre já está
// em dia e não vale derrubar o boot por um soluço de rede); erro de SQL numa
// migration nova sempre derruba — app rodando com schema pela metade é pior.

import nextEnv from "@next/env";
import { rodarMigrations } from "../lib/db/migrate.mjs";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
  info: () => {},
  error: console.error,
});

const opcional = process.argv.includes("--if-configured");
const url = process.env.DATABASE_URL;

if (!url) {
  const msg = "[migrate] DATABASE_URL não configurada — migrations não foram aplicadas.";
  if (opcional) {
    console.warn(msg);
    process.exit(0);
  }
  console.error(msg);
  process.exit(1);
}

let resultados;
try {
  resultados = await rodarMigrations(url);
} catch (e) {
  console.error(`[migrate] não consegui conectar no Postgres: ${e instanceof Error ? e.message : e}`);
  process.exit(opcional ? 0 : 1);
}

for (const r of resultados) {
  if (r.status === "aplicada") console.log(`[migrate] ✓ ${r.arquivo}`);
  if (r.status === "erro") console.error(`[migrate] ✗ ${r.arquivo}: ${r.erro}`);
}
const novas = resultados.filter((r) => r.status === "aplicada").length;
if (novas === 0 && !resultados.some((r) => r.status === "erro")) {
  console.log("[migrate] schema em dia.");
}

process.exit(resultados.some((r) => r.status === "erro") ? 1 : 0);
