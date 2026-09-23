import { HeadsetIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader, EmptyState } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBar } from "@/components/ui/Stats";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNumero, formatRelativo } from "@/lib/format";
import type { LigadorResumo } from "@/lib/types";
import { NovoLigadorForm } from "./NovoLigadorForm";
import { BotaoAtivo } from "./BotaoAtivo";

export default async function LigadoresPage() {
  await requireAdminSession();

  const { data: ligadores } = await createAdminClient()
    .from("ligadores_resumo")
    .select("*")
    .order("ativo", { ascending: false })
    .order("pendentes", { ascending: false })
    .order("nome")
    .returns<LigadorResumo[]>();

  const lista = ligadores ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Equipe"
        title="Ligadores"
        description="Quem está ligando, quanto cada um tem na fila e quando mexeu por último."
      />

      <NovoLigadorForm inicialAberto={lista.length === 0} />

      {lista.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HeadsetIcon />}
            title="Nenhum ligador cadastrado"
            description="Crie o primeiro no formulário acima. Depois, distribua fichas pra ele dentro de uma rifa."
          />
        </Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {lista.map((l) => {
            const contagem = { deu_bom: l.deu_bom, deu_ruim: l.deu_ruim, pendente: l.pendentes };
            return (
              <div
                key={l.id}
                className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-5 py-4 md:grid-cols-[auto_minmax(0,1fr)_12rem_9rem_auto] ${
                  l.ativo ? "" : "opacity-60"
                }`}
              >
                <Avatar nome={l.nome} fotoUrl={l.foto_url} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{l.nome}</p>
                  <p className="text-[13px] text-fg-subtle">@{l.username}</p>
                </div>

                <div className="col-span-3 flex flex-col gap-1.5 md:col-span-1">
                  <StatusBar contagem={contagem} altura="h-1.5" />
                  <p className="text-[12px] tabular-nums text-fg-subtle">
                    <span className={l.pendentes > 0 ? "text-warning" : ""}>{formatNumero(l.pendentes)} pendentes</span> ·{" "}
                    {formatNumero(l.atribuidas)} no total
                  </p>
                </div>

                <p className="col-span-3 text-[12px] text-fg-subtle md:col-span-1">
                  {l.ultima_atividade ? `Ativo ${formatRelativo(l.ultima_atividade)}` : "Sem atividade ainda"}
                </p>

                <div className="col-start-3 row-start-1 md:col-start-5">
                  <BotaoAtivo ligadorId={l.id} ativo={l.ativo} />
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
