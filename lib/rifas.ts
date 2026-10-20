import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Rifa } from "@/lib/types";

const NOME_RIFA = "Familhão";

export function normalizarNomeRifa(nome: string): string {
  return nome.replace(/\s+/g, " ").trim();
}

export function validarNomeRifa(nome: string): string | null {
  if (nome.length < 2) return "Dê um nome pra rifa (pelo menos 2 letras).";
  if (nome.length > 60) return "Nome muito longo — até 60 caracteres.";
  return null;
}

export async function acharRifaPorNome(nome: string, ignorarId?: string): Promise<Rifa | null> {
  const { data } = await createAdminClient().from("rifas").select("id, nome, created_at").returns<Rifa[]>();
  const alvo = normalizarNomeRifa(nome).toLowerCase();
  return (data ?? []).find((r) => r.id !== ignorarId && normalizarNomeRifa(r.nome).toLowerCase() === alvo) ?? null;
}

export async function getRifaFamilhao(): Promise<{ id: string; nome: string }> {
  const supabase = createAdminClient();
  const existente = await acharRifaPorNome(NOME_RIFA);
  if (existente) return { id: existente.id, nome: existente.nome };
  const { data, error } = await supabase
    .from("rifas")
    .insert({ nome: NOME_RIFA })
    .select("id, nome")
    .single<{ id: string; nome: string }>();
  if (error || !data) throw new Error(`Falha ao criar rifa ${NOME_RIFA}: ${error?.message}`);
  return data;
}
