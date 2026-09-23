"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidarTudo(rifaId: string) {
  revalidatePath(`/admin/rifas/${rifaId}`);
  revalidatePath("/admin/rifas");
  revalidatePath("/admin/ligadores");
  revalidatePath("/admin");
  revalidatePath("/ligador");
}

export type EstadoDistribuicao = { erro?: string; enviadas?: number; ligadorNome?: string };

/** Manda N fichas disponíveis (pendentes, sem ligador) da rifa pro ligador escolhido. */
export async function distribuirFichas(
  _estadoAnterior: EstadoDistribuicao,
  formData: FormData,
): Promise<EstadoDistribuicao> {
  await requireAdminSession();

  const rifaId = String(formData.get("rifaId") ?? "");
  const ligadorId = String(formData.get("ligadorId") ?? "");
  const quantidade = Number(formData.get("quantidade"));

  if (!UUID.test(rifaId) || !UUID.test(ligadorId)) return { erro: "Escolha um ligador." };
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 100_000) {
    return { erro: "Quantidade inválida." };
  }

  const supabase = createAdminClient();
  const { data: ligador } = await supabase
    .from("ligadores")
    .select("nome, ativo")
    .eq("id", ligadorId)
    .maybeSingle<{ nome: string; ativo: boolean }>();
  if (!ligador) return { erro: "Ligador não encontrado." };
  if (!ligador.ativo) return { erro: `${ligador.nome} está inativo — ative antes de enviar fichas.` };

  const { data, error } = await supabase.rpc("distribuir_fichas", {
    p_rifa_id: rifaId,
    p_ligador_id: ligadorId,
    p_quantidade: quantidade,
  });
  if (error) return { erro: "Erro ao distribuir: " + error.message };

  const enviadas = Number(data ?? 0);
  if (enviadas === 0) return { erro: "Não sobrou nenhuma ficha disponível nessa rifa." };

  revalidarTudo(rifaId);
  return { enviadas, ligadorNome: ligador.nome };
}

/** Devolve pro pool as pendentes que o ligador tem nessa rifa. */
export async function recolherPendentes(rifaId: string, ligadorId: string): Promise<number> {
  await requireAdminSession();
  if (!UUID.test(rifaId) || !UUID.test(ligadorId)) return 0;

  const supabase = createAdminClient();
  const { data } = await supabase.rpc("recolher_pendentes", {
    p_rifa_id: rifaId,
    p_ligador_id: ligadorId,
  });

  revalidarTudo(rifaId);
  return Number(data ?? 0);
}

/** Tira uma ficha específica do ligador (volta pro pool se ainda estiver pendente). */
export async function revogarAcesso(rifaId: string, ligadorId: string, fichaId: string): Promise<void> {
  await requireAdminSession();
  const supabase = createAdminClient();
  await supabase.from("ligador_acesso").delete().eq("ligador_id", ligadorId).eq("ficha_id", fichaId);
  revalidarTudo(rifaId);
}
