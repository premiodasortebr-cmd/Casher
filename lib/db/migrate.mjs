// Runner de migrations — fonte única, usado pelo CLI (scripts/migrate.mjs, que
// roda no `npm run dev` e no start do Render) e pelo /setup local.
// Plain JS (.mjs) pra rodar com `node` puro, sem build nem tsx.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

/**
 * @typedef {{ arquivo: string, status: "aplicada" | "ja_aplicada" | "erro", erro?: string }} ResultadoMigracao
 */

/**
 * Tira `sslmode` da URL: o `pg` deixa o que vem na connection string sobrescrever
 * o objeto `ssl`, e `sslmode=require` vira verificação completa de certificado,
 * que falha com o pooler do Supabase.
 * @param {string} url
 */
function semSslmode(url) {
  return url.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, "");
}

/**
 * Aplica, em ordem, cada supabase/migrations/*.sql ainda não registrado em
 * `_casher_migrations`. Cada arquivo roda numa transação: ou entra inteiro, ou nada.
 * Para no primeiro erro.
 *
 * @param {string} connectionString
 * @param {{ dir?: string }} [opcoes]
 * @returns {Promise<ResultadoMigracao[]>}
 */
export async function rodarMigrations(connectionString, opcoes = {}) {
  const dir = opcoes.dir ?? path.join(process.cwd(), "supabase", "migrations");
  const arquivos = (await readdir(/*turbopackIgnore: true*/ dir)).filter((f) => f.endsWith(".sql")).sort();

  // TLS sem verificação de CA: é o que o pooler do Supabase aceita sem baixar o
  // certificado deles. Só as migrations usam essa conexão; o app fala via HTTPS.
  const client = new pg.Client({
    connectionString: semSslmode(connectionString),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();

  /** @type {ResultadoMigracao[]} */
  const resultados = [];
  try {
    await client.query(`
      create table if not exists public._casher_migrations (
        nome text primary key,
        aplicada_em timestamptz not null default now()
      );
      alter table public._casher_migrations enable row level security;
    `);
    const { rows } = await client.query("select nome from public._casher_migrations");
    const aplicadas = new Set(rows.map((r) => r.nome));

    for (const arquivo of arquivos) {
      if (aplicadas.has(arquivo)) {
        resultados.push({ arquivo, status: "ja_aplicada" });
        continue;
      }
      const sql = await readFile(path.join(/*turbopackIgnore: true*/ dir, arquivo), "utf-8");
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into public._casher_migrations (nome) values ($1)", [arquivo]);
        await client.query("commit");
        resultados.push({ arquivo, status: "aplicada" });
      } catch (e) {
        await client.query("rollback").catch(() => {});
        resultados.push({
          arquivo,
          status: "erro",
          erro: e instanceof Error ? e.message : String(e),
        });
        break;
      }
    }
  } finally {
    await client.end();
  }
  return resultados;
}
