"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseFichas } from "@/lib/import/parseFichas";

export type EstadoImport = {
  erro?: string;
  resumo?: { totalRifas: number; totalFichas: number; detalhes: { nome: string; fichas: number }[] };
};

export async function importarFichas(
  _estadoAnterior: EstadoImport,
  formData: FormData,
): Promise<EstadoImport> {
  await requireAdminSession();

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Selecione um arquivo .txt." };
  }

  const conteudo = await arquivo.text();
  const rifasImportadas = parseFichas(conteudo);
  if (rifasImportadas.length === 0) {
    return { erro: "Não encontrei nenhuma ficha nesse arquivo. Confira se o formato bate com o do checker." };
  }

  const supabase = createAdminClient();
  const detalhes: { nome: string; fichas: number }[] = [];
  let totalFichas = 0;

  for (const rifa of rifasImportadas) {
    const { data: rifaRow, error: erroRifa } = await supabase
      .from("rifas")
      .upsert(
        {
          nome: rifa.nome,
          premio_descricao: rifa.premio_descricao,
          premio_valor: rifa.premio_valor,
          data_sorteio: rifa.data_sorteio,
        },
        { onConflict: "nome" },
      )
      .select("id")
      .single();

    if (erroRifa || !rifaRow) {
      return { erro: `Erro ao salvar a rifa "${rifa.nome}": ${erroRifa?.message ?? "sem retorno"}` };
    }

    const linhas = rifa.fichas.map((f) => ({ ...f, rifa_id: rifaRow.id }));
    const { error: erroFichas } = await supabase
      .from("fichas")
      .upsert(linhas, { onConflict: "rifa_id,pedido" });

    if (erroFichas) {
      return { erro: `Erro ao salvar fichas da rifa "${rifa.nome}": ${erroFichas.message}` };
    }

    totalFichas += linhas.length;
    detalhes.push({ nome: rifa.nome, fichas: linhas.length });
  }

  revalidatePath("/admin/rifas");
  return { resumo: { totalRifas: rifasImportadas.length, totalFichas, detalhes } };
}
