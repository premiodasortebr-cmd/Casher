import { HeadsetIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader, EmptyState } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Ligador } from "@/lib/types";
import { NovoLigadorForm } from "./NovoLigadorForm";
import { BotaoAtivo } from "./BotaoAtivo";

export default async function LigadoresPage() {
  await requireAdminSession();

  const supabase = createAdminClient();
  const { data: ligadores } = await supabase
    .from("ligadores")
    .select("id, username, nome, foto_url, ativo, created_at")
    .order("created_at", { ascending: false })
    .returns<Ligador[]>();

  const lista = ligadores ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Equipe"
        title="Ligadores"
        description="Crie usuários e controle quem tem acesso à área de notificação."
      />

      <NovoLigadorForm />

      {lista.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HeadsetIcon />}
            title="Nenhum ligador cadastrado"
            description="Crie o primeiro ligador no formulário acima."
          />
        </Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {lista.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar nome={l.nome} fotoUrl={l.foto_url} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{l.nome}</p>
                  <p className="text-[13px] text-fg-subtle">@{l.username}</p>
                </div>
              </div>
              <BotaoAtivo ligadorId={l.id} ativo={l.ativo} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
