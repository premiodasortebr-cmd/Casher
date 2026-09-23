"use server";

import { revalidatePath } from "next/cache";
import { requireLigadorSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FichaStatus } from "@/lib/types";

export async function marcarStatus(
  fichaId: string,
  novoStatus: FichaStatus,
  observacao?: string,
): Promise<{ erro?: string }> {
  const sessao = await requireLigadorSession();
  const supabase = createAdminClient();

  // Autorização real: só marca se esse ligador tiver acesso concedido a essa ficha
  // (a service role key ignora RLS, então essa checagem é obrigatória aqui).
  const { data: acesso } = await supabase
    .from("ligador_acesso")
    .select("id")
    .eq("ligador_id", sessao.ligadorId)
    .eq("ficha_id", fichaId)
    .maybeSingle();

  if (!acesso) {
    return { erro: "Você não tem acesso a essa ficha." };
  }

  const { data: fichaAtual } = await supabase
    .from("fichas")
    .select("status")
    .eq("id", fichaId)
    .single();

  const { error } = await supabase
    .from("fichas")
    .update({
      status: novoStatus,
      status_atualizado_por: sessao.ligadorId,
      status_atualizado_em: new Date().toISOString(),
      observacao: observacao ?? null,
    })
    .eq("id", fichaId);

  if (error) return { erro: error.message };

  await supabase.from("ficha_status_log").insert({
    ficha_id: fichaId,
    ligador_id: sessao.ligadorId,
    status_anterior: fichaAtual?.status ?? null,
    status_novo: novoStatus,
    observacao: observacao ?? null,
  });

  revalidatePath("/ligador");
  return {};
}
