import { SignOutIcon, TicketIcon } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";
import { requireLigadorSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { sairLigador } from "@/lib/auth/actions";
import { FichaCard } from "./FichaCard";
import type { FichaStatus } from "@/lib/types";

interface FichaComRifa {
  id: string;
  cpf: string;
  nome: string;
  telefone: string | null;
  status: FichaStatus;
  observacao: string | null;
  rifa_id: string;
  rifas: { nome: string } | null;
}

export default async function LigadorHomePage() {
  const sessao = await requireLigadorSession();
  const supabase = createAdminClient();

  const { data: acessos } = await supabase
    .from("ligador_acesso")
    .select("ficha_id")
    .eq("ligador_id", sessao.ligadorId);

  const fichaIds = (acessos ?? []).map((a) => a.ficha_id);

  const { data: fichas } = fichaIds.length
    ? await supabase
        .from("fichas")
        .select("id, cpf, nome, telefone, status, observacao, rifa_id, rifas(nome)")
        .in("id", fichaIds)
        .order("nome")
        .returns<FichaComRifa[]>()
    : { data: [] };

  const porRifa = new Map<string, { nome: string; fichas: FichaComRifa[] }>();
  for (const f of fichas ?? []) {
    const grupo = porRifa.get(f.rifa_id) ?? { nome: f.rifas?.nome ?? "Rifa", fichas: [] };
    grupo.fichas.push(f);
    porRifa.set(f.rifa_id, grupo);
  }

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Logo compact />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar nome={sessao.nome} size="sm" />
              <span className="hidden text-[13.5px] font-medium text-fg sm:inline">{sessao.nome}</span>
            </div>
            <form action={sairLigador}>
              <button
                type="submit"
                aria-label="Sair"
                title="Sair"
                className="flex size-8 items-center justify-center rounded-full text-fg-subtle transition-colors duration-300 ease-spring hover:bg-white/[0.06] hover:text-fg"
              >
                <SignOutIcon size={17} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {porRifa.size === 0 ? (
          <Card>
            <EmptyState
              icon={<TicketIcon />}
              title="Nenhuma ficha liberada"
              description="Assim que o admin conceder acesso a fichas, elas aparecem aqui."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-8">
            {Array.from(porRifa.entries()).map(([rifaId, grupo]) => (
              <section key={rifaId} className="flex flex-col gap-3">
                <h2 className="px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
                  {grupo.nome}
                </h2>
                <div className="flex flex-col gap-3">
                  {grupo.fichas.map((f) => (
                    <FichaCard key={f.id} ficha={f} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
