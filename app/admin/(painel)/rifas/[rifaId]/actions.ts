"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function concederAcesso(
  rifaId: string,
  ligadorId: string,
  fichaIds: string[],
): Promise<void> {
  await requireAdminSession();
  if (fichaIds.length === 0) return;

  const supabase = createAdminClient();
  const linhas = fichaIds.map((ficha_id) => ({ ligador_id: ligadorId, ficha_id }));
  await supabase.from("ligador_acesso").upsert(linhas, { onConflict: "ligador_id,ficha_id" });

  revalidatePath(`/admin/rifas/${rifaId}`);
}

export async function revogarAcesso(
  rifaId: string,
  ligadorId: string,
  fichaId: string,
): Promise<void> {
  await requireAdminSession();
  const supabase = createAdminClient();
  await supabase
    .from("ligador_acesso")
    .delete()
    .eq("ligador_id", ligadorId)
    .eq("ficha_id", fichaId);

  revalidatePath(`/admin/rifas/${rifaId}`);
}
