import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Rifa } from "@/lib/types";

/** "  bolada   pix " -> "bolada pix" (o banco compara por lower(btrim(nome))). */
export function normalizarNomeRifa(nome: string): string {
  return nome.replace(/\s+/g, " ").trim();
}

export function validarNomeRifa(nome: string): string | null {
  if (nome.length < 2) return "Dê um nome pra rifa (pelo menos 2 letras).";
  if (nome.length > 60) return "Nome muito longo — até 60 caracteres.";
  return null;
}

/** Rifa com o mesmo nome, ignorando maiúsculas e espaços — a tabela é pequena. */
export async function acharRifaPorNome(nome: string, ignorarId?: string): Promise<Rifa | null> {
  const { data } = await createAdminClient().from("rifas").select("id, nome, created_at").returns<Rifa[]>();
  const alvo = normalizarNomeRifa(nome).toLowerCase();
  return (data ?? []).find((r) => r.id !== ignorarId && normalizarNomeRifa(r.nome).toLowerCase() === alvo) ?? null;
}
