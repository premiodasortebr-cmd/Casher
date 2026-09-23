import "server-only";
import { headers } from "next/headers";

/**
 * Limite de tentativas de login em memória. Suficiente pra uma instância única
 * (Render free/starter); zera se o processo reinicia. O PIN do admin tem só 10^6
 * combinações — sem isso dá pra achar por força bruta em poucos dias.
 */

interface Janela {
  falhas: number;
  inicio: number;
}

const janelas = new Map<string, Janela>();

function limpar(agora: number, janelaMs: number) {
  if (janelas.size < 5000) return;
  for (const [k, j] of janelas) if (agora - j.inicio > janelaMs) janelas.delete(k);
}

export interface Regra {
  chave: string;
  maxFalhas: number;
  janelaMs: number;
}

/** Retorna quantos segundos faltam pra liberar, ou 0 se pode tentar. */
export function bloqueadoPor(regras: Regra[]): number {
  const agora = Date.now();
  let maior = 0;
  for (const r of regras) {
    const j = janelas.get(r.chave);
    if (!j) continue;
    if (agora - j.inicio > r.janelaMs) {
      janelas.delete(r.chave);
      continue;
    }
    if (j.falhas >= r.maxFalhas) {
      maior = Math.max(maior, Math.ceil((j.inicio + r.janelaMs - agora) / 1000));
    }
  }
  return maior;
}

export function registrarFalha(regras: Regra[]) {
  const agora = Date.now();
  for (const r of regras) {
    limpar(agora, r.janelaMs);
    const j = janelas.get(r.chave);
    if (!j || agora - j.inicio > r.janelaMs) janelas.set(r.chave, { falhas: 1, inicio: agora });
    else j.falhas += 1;
  }
}

export function limparFalhas(regras: Regra[]) {
  for (const r of regras) janelas.delete(r.chave);
}

/**
 * IP do cliente atrás do proxy do Render (Cloudflare na frente). O X-Forwarded-For
 * mais à esquerda pode ser forjado pelo cliente, então vem por último.
 */
export async function ipDoCliente(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ??
    h.get("true-client-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
    "desconhecido"
  );
}

export function mensagemBloqueio(segundos: number): string {
  const minutos = Math.ceil(segundos / 60);
  return `Muitas tentativas. Tente de novo em ${minutos} minuto${minutos > 1 ? "s" : ""}.`;
}

const QUINZE_MIN = 15 * 60 * 1000;
const UMA_HORA = 60 * 60 * 1000;

/** PIN do admin: 5 erros por IP a cada 15 min + teto global de 50/hora (ataque distribuído). */
export function regrasAdmin(ip: string): Regra[] {
  return [
    { chave: `admin:ip:${ip}`, maxFalhas: 5, janelaMs: QUINZE_MIN },
    { chave: "admin:global", maxFalhas: 50, janelaMs: UMA_HORA },
  ];
}

/** Ligador: 8 erros por IP e 8 por usuário a cada 15 min. */
export function regrasLigador(ip: string, username: string): Regra[] {
  return [
    { chave: `ligador:ip:${ip}`, maxFalhas: 8, janelaMs: QUINZE_MIN },
    { chave: `ligador:user:${username}`, maxFalhas: 8, janelaMs: QUINZE_MIN },
  ];
}
