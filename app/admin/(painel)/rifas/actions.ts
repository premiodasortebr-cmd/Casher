"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { acharRifaPorNome, normalizarNomeRifa, validarNomeRifa } from "@/lib/rifas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EstadoRifa = { erro?: string; sucesso?: boolean; rifaId?: string };

function revalidarRifas(rifaId?: string) {
  revalidatePath("/admin/rifas");
  revalidatePath("/admin/rifas/importar");
  revalidatePath("/admin");
  if (rifaId) revalidatePath(`/admin/rifas/${rifaId}`);
  revalidatePath("/ligador");
}

export async function criarRifa(_estado: EstadoRifa, formData: FormData): Promise<EstadoRifa> {
  await requireAdminSession();
  const nome = normalizarNomeRifa(String(formData.get("nome") ?? ""));
  const invalido = validarNomeRifa(nome);
  if (invalido) return { erro: invalido };

  const existente = await acharRifaPorNome(nome);
  if (existente) return { erro: `Já existe a rifa "${existente.nome}".` };

  const { data, error } = await createAdminClient().from("rifas").insert({ nome }).select("id").single();
  if (error || !data) {
    return { erro: error?.code === "23505" ? `Já existe a rifa "${nome}".` : `Erro ao criar: ${error?.message}` };
  }

  revalidarRifas();
  return { sucesso: true, rifaId: data.id };
}

export async function renomearRifa(_estado: EstadoRifa, formData: FormData): Promise<EstadoRifa> {
  await requireAdminSession();
  const rifaId = String(formData.get("rifaId") ?? "");
  const nome = normalizarNomeRifa(String(formData.get("nome") ?? ""));
  if (!UUID.test(rifaId)) return { erro: "Rifa inválida." };
  const invalido = validarNomeRifa(nome);
  if (invalido) return { erro: invalido };

  const existente = await acharRifaPorNome(nome, rifaId);
  if (existente) return { erro: `Já existe a rifa "${existente.nome}".` };

  const { error } = await createAdminClient().from("rifas").update({ nome }).eq("id", rifaId);
  if (error) {
    return { erro: error.code === "23505" ? `Já existe a rifa "${nome}".` : `Erro ao renomear: ${error.message}` };
  }

  revalidarRifas(rifaId);
  return { sucesso: true, rifaId };
}

/** Só apaga rifa vazia — fichas nunca somem por um clique. */
export async function excluirRifa(rifaId: string): Promise<EstadoRifa> {
  await requireAdminSession();
  if (!UUID.test(rifaId)) return { erro: "Rifa inválida." };

  const supabase = createAdminClient();
  const { count } = await supabase.from("fichas").select("id", { count: "exact", head: true }).eq("rifa_id", rifaId);
  if ((count ?? 0) > 0) return { erro: "Essa rifa tem fichas — só dá pra excluir rifa vazia." };

  const { error } = await supabase.from("rifas").delete().eq("id", rifaId);
  if (error) return { erro: `Erro ao excluir: ${error.message}` };

  revalidarRifas();
  redirect("/admin/rifas");
}
