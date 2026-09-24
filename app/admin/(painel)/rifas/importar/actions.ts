"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseFichas } from "@/lib/import/parseFichas";
import { acharRifaPorNome, normalizarNomeRifa, validarNomeRifa } from "@/lib/rifas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOTE_UPSERT = 500;
const LOTE_CONSULTA = 200;

export type EstadoImport = {
  erro?: string;
  resumo?: {
    rifaId: string;
    rifaNome: string;
    rifaCriada: boolean;
    novas: number;
    atualizadas: number;
    compras: number;
    semTelefone: number;
  };
};

function lotes<T>(itens: T[], tamanho: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) out.push(itens.slice(i, i + tamanho));
  return out;
}

/** Tudo do .txt vai pra UMA rifa, escolhida (ou criada) antes. Uma ficha por CPF na rifa. */
export async function importarFichas(_estado: EstadoImport, formData: FormData): Promise<EstadoImport> {
  await requireAdminSession();
  const supabase = createAdminClient();

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Selecione o arquivo .txt do checker." };

  const { fichas, compras } = parseFichas(await arquivo.text());
  if (fichas.length === 0) {
    return { erro: "Não encontrei nenhuma ficha nesse arquivo. Confira se é o .txt exportado pelo checker." };
  }

  // Rifa: uma existente (rifaId) ou uma nova pelo nome (reaproveita se o nome já existe).
  let rifa: { id: string; nome: string };
  let rifaCriada = false;
  const rifaId = String(formData.get("rifaId") ?? "");
  if (rifaId && rifaId !== "nova") {
    if (!UUID.test(rifaId)) return { erro: "Escolha a rifa." };
    const { data } = await supabase.from("rifas").select("id, nome").eq("id", rifaId).maybeSingle<{ id: string; nome: string }>();
    if (!data) return { erro: "Essa rifa não existe mais — escolha outra." };
    rifa = data;
  } else {
    const nome = normalizarNomeRifa(String(formData.get("novaRifa") ?? ""));
    const invalido = validarNomeRifa(nome);
    if (invalido) return { erro: invalido };
    const existente = await acharRifaPorNome(nome);
    if (existente) {
      rifa = existente;
    } else {
      const { data, error } = await supabase.from("rifas").insert({ nome }).select("id, nome").single<{ id: string; nome: string }>();
      if (error || !data) return { erro: `Não consegui criar a rifa: ${error?.message ?? "sem retorno"}` };
      rifa = data;
      rifaCriada = true;
    }
  }

  // Quantas já existiam nessa rifa (pra dizer "X novas, Y atualizadas").
  let atualizadas = 0;
  for (const lote of lotes(fichas.map((f) => f.cpf), LOTE_CONSULTA)) {
    const { count, error } = await supabase
      .from("fichas")
      .select("id", { count: "exact", head: true })
      .eq("rifa_id", rifa.id)
      .in("cpf", lote);
    if (error) return { erro: `Erro ao conferir fichas existentes: ${error.message}` };
    atualizadas += count ?? 0;
  }

  // Upsert por (rifa_id, cpf): atualiza nome/telefone/compra e NÃO mexe no status.
  let gravadas = 0;
  for (const lote of lotes(fichas, LOTE_UPSERT)) {
    const { error } = await supabase
      .from("fichas")
      .upsert(lote.map((f) => ({ ...f, rifa_id: rifa.id })), { onConflict: "rifa_id,cpf" });
    if (error) {
      revalidatePath(`/admin/rifas/${rifa.id}`);
      return {
        erro:
          `Erro ao salvar fichas: ${error.message}.` +
          (gravadas > 0 ? ` ${gravadas} de ${fichas.length} já tinham sido salvas — reimportar o arquivo completa sem duplicar.` : ""),
      };
    }
    gravadas += lote.length;
  }

  revalidatePath("/admin/rifas");
  revalidatePath("/admin/rifas/importar");
  revalidatePath(`/admin/rifas/${rifa.id}`);
  revalidatePath("/admin");
  revalidatePath("/ligador");

  return {
    resumo: {
      rifaId: rifa.id,
      rifaNome: rifa.nome,
      rifaCriada,
      novas: fichas.length - atualizadas,
      atualizadas,
      compras,
      semTelefone: fichas.filter((f) => !f.telefone).length,
    },
  };
}
