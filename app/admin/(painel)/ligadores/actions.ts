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
