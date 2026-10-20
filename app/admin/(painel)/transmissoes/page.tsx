import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PainelTransmissoes } from "./PainelTransmissoes";

export default async function TransmissoesPage() {
  await requireAdminSession();
  const supabase = createAdminClient();

  const { data: ligadores } = await supabase
    .from("ligadores")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome")
    .returns<{ id: string; nome: string }[]>();

  return <PainelTransmissoes ligadores={ligadores ?? []} />;
}
