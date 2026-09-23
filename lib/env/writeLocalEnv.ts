import "server-only";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ENV_LOCAL_PATH = path.join(process.cwd(), ".env.local");

/**
 * Atualiza (ou cria) `.env.local` com as chaves passadas, sem mexer no resto do
 * arquivo — linhas de outras variáveis e comentários ficam como estavam.
 */
export async function upsertEnvLocal(valores: Record<string, string>): Promise<void> {
  let conteudoAtual = "";
  try {
    conteudoAtual = await readFile(ENV_LOCAL_PATH, "utf-8");
  } catch {
    // Arquivo ainda não existe — começa do zero.
  }

  const linhas = conteudoAtual.length > 0 ? conteudoAtual.split(/\r?\n/) : [];
  const chavesRestantes = new Set(Object.keys(valores));

  const novasLinhas = linhas.map((linha) => {
    const m = linha.match(/^([A-Z0-9_]+)=/);
    if (m && chavesRestantes.has(m[1])) {
      chavesRestantes.delete(m[1]);
      return `${m[1]}=${valores[m[1]]}`;
    }
    return linha;
  });

  for (const chave of chavesRestantes) {
    novasLinhas.push(`${chave}=${valores[chave]}`);
  }

  while (novasLinhas.length > 0 && novasLinhas[novasLinhas.length - 1] === "") {
    novasLinhas.pop();
  }

  await writeFile(ENV_LOCAL_PATH, novasLinhas.join("\n") + "\n", "utf-8");
}
