import type { FichaStatus } from "./types";

export type SearchParams = Record<string, string | string[] | undefined>;

export function texto(sp: SearchParams, chave: string, max = 80): string {
  const v = sp[chave];
  return (typeof v === "string" ? v : "").trim().slice(0, max);
}

export function pagina(sp: SearchParams): number {
  const n = parseInt(texto(sp, "pagina"), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function ehStatus(v: string): v is FichaStatus {
  return v === "pendente" || v === "deu_bom" || v === "deu_ruim";
}

/**
 * Prepara o termo pro `ilike` na coluna `busca` de fichas_lista. Se a pessoa
 * digitou só número/pontuação ("213.069-68", "(11) 99350"), vira só dígitos —
 * a coluna guarda CPF e telefone também sem pontuação.
 */
export function normalizarBusca(q: string): string {
  const limpo = q.replace(/[%\\]/g, "").trim();
  const digitos = limpo.replace(/\D/g, "");
  const soNumero = digitos.length > 0 && limpo.replace(/[\d.\-\s()+]/g, "") === "";
  return soNumero ? digitos : limpo;
}

/** Monta `?a=1&b=2` a partir dos filtros atuais + alterações; valor vazio remove a chave. */
export function montarQuery(
  atual: Record<string, string | undefined>,
  patch: Record<string, string | number | undefined> = {},
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...atual, ...patch })) {
    if (v == null || v === "" || (k === "pagina" && Number(v) <= 1)) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
