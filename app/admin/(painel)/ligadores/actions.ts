"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guard";
import { hashSegredo } from "@/lib/auth/password";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoLigador = { erro?: string; sucesso?: boolean };

export async function criarLigador(
  _estadoAnterior: EstadoLigador,
  formData: FormData,
): Promise<EstadoLigador> {
  await requireAdminSession();

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const foto_url = String(formData.get("foto_url") ?? "").trim() || null;

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return {
      erro: "Usuário deve ter 3-32 caracteres: letras minúsculas, números, ponto, hífen ou underline.",
    };
  }
  if (senha.length < 6) {
    return { erro: "Senha precisa ter pelo menos 6 caracteres." };
  }
  if (!nome) {
    return { erro: "Informe o nome do ligador." };
  }

  const supabase = createAdminClient();
  const password_hash = await hashSegredo(senha);

  const { error } = await supabase.from("ligadores").insert({
    username,
    password_hash,
    nome,
    foto_url,
  });

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe um ligador com esse usuário." };
    }
    return { erro: "Erro ao criar ligador: " + error.message };
  }

  revalidatePath("/admin/ligadores");
  return { sucesso: true };
}

export async function alternarAtivoLigador(ligadorId: string, ativo: boolean): Promise<void> {
  await requireAdminSession();
  const supabase = createAdminClient();
  await supabase.from("ligadores").update({ ativo }).eq("id", ligadorId);
  revalidatePath("/admin/ligadores");
}

export async function excluirLigador(ligadorId: string): Promise<{ erro?: string }> {
  await requireAdminSession();
  const supabase = createAdminClient();

  const { data: ligador } = await supabase
    .from("ligadores")
    .select("nome")
    .eq("id", ligadorId)
    .maybeSingle<{ nome: string }>();
  if (!ligador) return { erro: "Ligador não encontrado." };

  await supabase
    .from("ficha_status_log")
    .delete()
    .eq("ligador_id", ligadorId);
  await supabase
    .from("fichas")
    .update({ status_atualizado_por: null })
    .eq("status_atualizado_por", ligadorId);

  const { error } = await supabase.from("ligadores").delete().eq("id", ligadorId);
  if (error) return { erro: `Erro ao excluir ${ligador.nome}: ${error.message}` };

  revalidatePath("/admin/ligadores");
  revalidatePath("/admin");
  revalidatePath("/ligador");
  return {};
}

export async function excluirTodasFichas(): Promise<{ erro?: string; excluidas?: number }> {
  await requireAdminSession();
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("fichas")
    .select("id", { count: "exact", head: true });

  if (!count || count === 0) return { erro: "Não há fichas pra excluir." };

  const { error } = await supabase.from("fichas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return { erro: `Erro ao excluir fichas: ${error.message}` };

  revalidatePath("/admin");
  revalidatePath("/admin/ligadores");
  revalidatePath("/ligador");
  return { excluidas: count };
}

export async function redefinirSenhaLigador(
  _estadoAnterior: EstadoLigador,
  formData: FormData,
): Promise<EstadoLigador> {
  await requireAdminSession();

  const ligadorId = String(formData.get("ligadorId") ?? "");
  const novaSenha = String(formData.get("novaSenha") ?? "");
  if (novaSenha.length < 6) {
    return { erro: "Senha precisa ter pelo menos 6 caracteres." };
  }

  const supabase = createAdminClient();
  const password_hash = await hashSegredo(novaSenha);
  const { error } = await supabase
    .from("ligadores")
    .update({ password_hash })
    .eq("id", ligadorId);

  if (error) return { erro: "Erro ao redefinir senha: " + error.message };

  revalidatePath("/admin/ligadores");
  return { sucesso: true };
}
