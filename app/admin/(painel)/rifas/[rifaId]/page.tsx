import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/Layout";
import { ButtonLink } from "@/components/ui/Button";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { FichasAcesso } from "./FichasAcesso";
import type { FichaStatus } from "@/lib/types";

export default async function RifaDetalhePage({
  params,
}: {
  params: Promise<{ rifaId: string }>;
}) {
  await requireAdminSession();
  const { rifaId } = await params;

  const supabase = createAdminClient();

  const { data: rifa } = await supabase
    .from("rifas")
    .select("id, nome, premio_descricao, premio_valor, data_sorteio")
    .eq("id", rifaId)
    .maybeSingle();

  if (!rifa) notFound();

  const { data: fichas } = await supabase
    .from("fichas")
    .select("id, cpf, nome, telefone, status")
    .eq("rifa_id", rifaId)
    .order("nome")
    .returns<{ id: string; cpf: string; nome: string; telefone: string | null; status: FichaStatus }[]>();

  const fichaIds = (fichas ?? []).map((f) => f.id);

  const { data: acessos } = fichaIds.length
    ? await supabase
        .from("ligador_acesso")
        .select("ficha_id, ligador_id, ligadores(nome)")
        .in("ficha_id", fichaIds)
        .returns<{ ficha_id: string; ligador_id: string; ligadores: { nome: string } | null }[]>()
    : { data: [] };

  const { data: ligadores } = await supabase
    .from("ligadores")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome")
    .returns<{ id: string; nome: string }[]>();

  const acessosPorFicha = new Map<string, { ligadorId: string; nome: string }[]>();
  for (const a of acessos ?? []) {
    const lista = acessosPorFicha.get(a.ficha_id) ?? [];
    lista.push({ ligadorId: a.ligador_id, nome: a.ligadores?.nome ?? "?" });
    acessosPorFicha.set(a.ficha_id, lista);
  }

  const fichasComAcesso = (fichas ?? []).map((f) => ({
    ...f,
    acessos: acessosPorFicha.get(f.id) ?? [],
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Rifas"
        title={rifa.nome}
        description={rifa.premio_descricao ? `Prêmio: ${rifa.premio_descricao}` : undefined}
        back={
          <ButtonLink href="/admin/rifas" variant="ghost" size="sm" icon={<ArrowLeftIcon />}>
            Voltar
          </ButtonLink>
        }
      />

      <FichasAcesso rifaId={rifaId} fichas={fichasComAcesso} ligadores={ligadores ?? []} />
    </div>
  );
}
