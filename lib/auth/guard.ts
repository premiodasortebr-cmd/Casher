import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessaoAdmin, getSessaoLigador } from "./session";

/**
 * Confere a sessão dentro da própria Server Action/Server Component — não só
 * no proxy. O cliente Supabase usado no servidor tem a service role key (que
 * ignora RLS), então essa checagem é a ÚNICA barreira de autorização real.
 */
export async function requireAdminSession() {
  const sessao = await getSessaoAdmin();
  if (!sessao) redirect("/admin/login");
  return sessao;
}

// cache(): layout + página + actions da mesma requisição consultam o banco uma vez só.
const ligadorAtivo = cache(async (ligadorId: string) => {
  const { data } = await createAdminClient()
    .from("ligadores")
    .select("ativo")
    .eq("id", ligadorId)
    .maybeSingle<{ ativo: boolean }>();
  return data?.ativo === true;
});

/** Além do JWT, exige que o ligador ainda exista e esteja ativo — desativar corta na hora. */
export async function requireLigadorSession() {
  const sessao = await getSessaoLigador();
  if (!sessao) redirect("/ligador/login");
  if (!(await ligadorAtivo(sessao.ligadorId))) redirect("/ligador/login?desativado=1");
  return sessao;
}
