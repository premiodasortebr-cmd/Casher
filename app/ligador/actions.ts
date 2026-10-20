"use server";

import { revalidatePath } from "next/cache";
import { requireLigadorSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EstadoPremio, FichaStatus } from "@/lib/types";

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
  revalidatePath(`/ligador/ficha/${fichaId}`);
  return {};
}

async function verificarAcessoFicha(ligadorId: string, fichaId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ligador_acesso")
    .select("id")
    .eq("ligador_id", ligadorId)
    .eq("ficha_id", fichaId)
    .maybeSingle();
  return !!data;
}

async function cpfDaFicha(fichaId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("fichas").select("cpf").eq("id", fichaId).maybeSingle<{ cpf: string }>();
  return data?.cpf ?? null;
}

export async function definirCodigoPremio(
  fichaId: string,
  codigo: string,
): Promise<{ erro?: string }> {
  const sessao = await requireLigadorSession();
  if (!(await verificarAcessoFicha(sessao.ligadorId, fichaId))) return { erro: "Sem acesso." };
  const cpf = await cpfDaFicha(fichaId);
  if (!cpf) return { erro: "Ficha não encontrada." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("premio_resgate")
    .upsert(
      { cpf, codigo: codigo.trim() || null, updated_at: new Date().toISOString() },
      { onConflict: "cpf" },
    );
  if (error) return { erro: error.message };
  revalidatePath(`/ligador/ficha/${fichaId}`);
  return {};
}

export async function definirValorPremio(
  fichaId: string,
  valor: number,
): Promise<{ erro?: string }> {
  const sessao = await requireLigadorSession();
  if (!(await verificarAcessoFicha(sessao.ligadorId, fichaId))) return { erro: "Sem acesso." };
  const cpf = await cpfDaFicha(fichaId);
  if (!cpf) return { erro: "Ficha não encontrada." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("premio_resgate")
    .upsert(
      { cpf, valor, updated_at: new Date().toISOString() },
      { onConflict: "cpf" },
    );
  if (error) return { erro: error.message };
  revalidatePath(`/ligador/ficha/${fichaId}`);
  return {};
}

export async function definirEstadoPremio(
  fichaId: string,
  estado: EstadoPremio,
): Promise<{ erro?: string }> {
  const sessao = await requireLigadorSession();
  if (!(await verificarAcessoFicha(sessao.ligadorId, fichaId))) return { erro: "Sem acesso." };
  const cpf = await cpfDaFicha(fichaId);
  if (!cpf) return { erro: "Ficha não encontrada." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("premio_resgate")
    .upsert(
      { cpf, estado, updated_at: new Date().toISOString() },
      { onConflict: "cpf" },
    );
  if (error) return { erro: error.message };
  revalidatePath(`/ligador/ficha/${fichaId}`);
  return {};
}

export async function resetarPremio(fichaId: string): Promise<{ erro?: string }> {
  const sessao = await requireLigadorSession();
  if (!(await verificarAcessoFicha(sessao.ligadorId, fichaId))) return { erro: "Sem acesso." };
  const cpf = await cpfDaFicha(fichaId);
  if (!cpf) return { erro: "Ficha não encontrada." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("premio_resgate").delete().eq("cpf", cpf);
  if (error) return { erro: error.message };
  revalidatePath(`/ligador/ficha/${fichaId}`);
  return {};
}

export async function salvarDadosCliente(
  fichaId: string,
  dados: { nome?: string; nascimento?: string },
): Promise<{ erro?: string }> {
  const sessao = await requireLigadorSession();
  if (!(await verificarAcessoFicha(sessao.ligadorId, fichaId))) return { erro: "Sem acesso." };

  const supabase = createAdminClient();
  const update: Record<string, string> = {};
  if (dados.nome !== undefined) update.nome = dados.nome;
  if (dados.nascimento !== undefined) update.nascimento = dados.nascimento;
  if (Object.keys(update).length === 0) return {};

  const { error } = await supabase.from("fichas").update(update).eq("id", fichaId);
  if (error) return { erro: error.message };
  revalidatePath(`/ligador/ficha/${fichaId}`);
  revalidatePath("/ligador");
  return {};
}
