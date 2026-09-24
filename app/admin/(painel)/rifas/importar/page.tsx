import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Layout";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { texto, type SearchParams } from "@/lib/listagem";
import type { RifaResumo } from "@/lib/types";
import { ImportarForm } from "./ImportarForm";

export default async function ImportarFichasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdminSession();
  const sp = await searchParams;

  const { data } = await createAdminClient()
    .from("rifas_resumo")
    .select("id, nome, total")
    .order("nome")
    .returns<Pick<RifaResumo, "id" | "nome" | "total">[]>();
  const rifas = data ?? [];
  const pedida = texto(sp, "rifa");
  const inicial = rifas.some((r) => r.id === pedida) ? pedida : rifas.length === 1 ? rifas[0].id : "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        eyebrow="Rifas"
        title="Importar fichas"
        description="Escolha a rifa e suba o .txt do checker. Tudo que estiver no arquivo entra nessa rifa — uma ficha por pessoa. Reimportar atualiza, não duplica."
        back={
          <ButtonLink href="/admin/rifas" variant="ghost" size="sm" icon={<ArrowLeftIcon />}>
            Rifas
          </ButtonLink>
        }
      />
      <ImportarForm rifas={rifas} rifaInicial={inicial} />
    </div>
  );
}
