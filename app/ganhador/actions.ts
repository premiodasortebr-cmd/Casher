"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface DadosGanhador {
  nome: string;
  cpf: string;
  nascimento: string | null;
  cidade: string | null;
  endereco: string | null;
  telefone: string | null;
  premio: {
    codigo: string | null;
    estado: "bloqueado" | "liberado" | "pagamento_parcial";
    valor: number | null;
    pix_tipo: string | null;
    pix_chave: string | null;
  } | null;
}

export type ResultadoConsulta =
  | { ok: true; dados: DadosGanhador }
  | { ok: false; erro: string };

export async function consultarCpf(cpfBruto: string): Promise<ResultadoConsulta> {
  const cpf = cpfBruto.replace(/\D/g, "");
  if (cpf.length !== 11) return { ok: false, erro: "CPF inválido." };

  const supabase = createAdminClient();

  const { data: ficha } = await supabase
    .from("fichas")
    .select("nome, cpf, nascimento, cidade, endereco, telefone")
    .eq("cpf", cpf)
    .limit(1)
    .maybeSingle<{
      nome: string;
      cpf: string;
      nascimento: string | null;
      cidade: string | null;
      endereco: string | null;
      telefone: string | null;
    }>();

  if (!ficha) return { ok: false, erro: "CPF não encontrado." };

  const { data: premio } = await supabase
    .from("premio_resgate")
    .select("codigo, estado, valor, pix_tipo, pix_chave")
    .eq("cpf", cpf)
    .maybeSingle<{
      codigo: string | null;
      estado: "bloqueado" | "liberado" | "pagamento_parcial";
      valor: number | null;
      pix_tipo: string | null;
      pix_chave: string | null;
    }>();

  return {
    ok: true,
    dados: {
      ...ficha,
      premio: premio ?? null,
    },
  };
}

export async function enviarPixChave(
  cpfBruto: string,
  pixTipo: string,
  pixChave: string,
): Promise<{ ok: boolean; erro?: string }> {
  const cpf = cpfBruto.replace(/\D/g, "");
  if (cpf.length !== 11) return { ok: false, erro: "CPF inválido." };
  if (!pixTipo || !pixChave.trim()) return { ok: false, erro: "Preencha a chave Pix." };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("premio_resgate")
    .upsert(
      { cpf, pix_tipo: pixTipo, pix_chave: pixChave.trim(), updated_at: new Date().toISOString() },
      { onConflict: "cpf" },
    );

  if (error) return { ok: false, erro: "Erro ao salvar. Tente novamente." };
  return { ok: true };
}
