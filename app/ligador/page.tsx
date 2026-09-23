import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutIcon, TicketIcon } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";
import { StatusBar, StatusLegenda } from "@/components/ui/Stats";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { requireLigadorSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { sairLigador } from "@/lib/auth/actions";
import { formatNumero } from "@/lib/format";
import { ehStatus, montarQuery, normalizarBusca, pagina as lerPagina, texto, type SearchParams } from "@/lib/listagem";
import type { FichaLista, LigadorResumo } from "@/lib/types";
import { FichaCard } from "./FichaCard";

const BASE = "/ligador";
const POR_PAGINA = 20;

export default async function LigadorHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [sessao, sp] = await Promise.all([requireLigadorSession(), searchParams]);
  const supabase = createAdminClient();

  const q = texto(sp, "q");
  const abaBruta = texto(sp, "status") || "pendente";
  const aba = abaBruta === "todas" || ehStatus(abaBruta) ? abaBruta : "pendente";
  const pagina = lerPagina(sp);
  const filtros = { q, status: aba === "pendente" ? "" : aba };

  let consulta = supabase
    .from("fichas_lista")
    .select("*", { count: "exact" })
    .eq("ligador_id", sessao.ligadorId);
  if (aba !== "todas") consulta = consulta.eq("status", aba);
  const busca = normalizarBusca(q);
  if (busca) consulta = consulta.ilike("busca", `%${busca}%`);

  const de = (pagina - 1) * POR_PAGINA;
  const [{ data: fichas, count, error }, { data: resumo }] = await Promise.all([
    consulta.order("nome").range(de, de + POR_PAGINA - 1).returns<FichaLista[]>(),
    supabase.from("ligadores_resumo").select("*").eq("id", sessao.ligadorId).maybeSingle<LigadorResumo>(),
  ]);

  // offset > total: PostgREST responde 416 (ex.: marcou todas as fichas da página 2).
  if (error?.code === "PGRST103") redirect(montarQuery(BASE, filtros));
  if (error) throw new Error(`Falha ao carregar fichas: ${error.message}`);

  const total = count ?? 0;
  const ultimaPagina = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (pagina > ultimaPagina) redirect(montarQuery(BASE, filtros, { pagina: ultimaPagina }));

  const contagem = {
    pendente: resumo?.pendentes ?? 0,
    deu_bom: resumo?.deu_bom ?? 0,
    deu_ruim: resumo?.deu_ruim ?? 0,
  };
  const abas: { chave: string; label: string; n: number }[] = [
    { chave: "pendente", label: "Pendentes", n: contagem.pendente },
    { chave: "deu_bom", label: "Deu bom", n: contagem.deu_bom },
    { chave: "deu_ruim", label: "Deu ruim", n: contagem.deu_ruim },
    { chave: "todas", label: "Todas", n: resumo?.atribuidas ?? 0 },
  ];

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 px-4 py-3.5 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href={BASE} aria-label="Início">
            <Logo compact />
          </Link>
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

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
        <Card className="animate-fade-up px-5 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-fg-subtle">Sua fila</p>
              <p className="mt-1 font-mono text-[34px] font-medium leading-none tracking-[-0.04em] tabular-nums text-fg">
                {formatNumero(contagem.pendente)}
                <span className="ml-2 text-[14px] font-normal tracking-normal text-fg-muted">pendentes</span>
              </p>
            </div>
            <p className="text-right text-[12.5px] text-fg-subtle">
              {formatNumero(contagem.deu_bom)} deu bom
              <br />
              {formatNumero(contagem.deu_ruim)} deu ruim
            </p>
          </div>
          <StatusBar contagem={contagem} className="mt-4" />
          <StatusLegenda contagem={contagem} />
        </Card>

        <div className="flex flex-col gap-3">
          <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {abas.map((a) => {
              const on = a.chave === aba;
              return (
                <Link
                  key={a.chave}
                  href={montarQuery(BASE, { q, status: a.chave === "pendente" ? "" : a.chave })}
                  scroll={false}
                  className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors duration-300 ease-spring ${
                    on ? "border-accent-line bg-accent-soft text-accent" : "border-line bg-white/[0.02] text-fg-muted hover:text-fg"
                  }`}
                >
                  {a.label}
                  <span className={`font-mono text-[11.5px] tabular-nums ${on ? "text-accent" : "text-fg-subtle"}`}>{a.n}</span>
                </Link>
              );
            })}
          </nav>
          <SearchInput placeholder="Buscar por nome, CPF ou telefone" />
        </div>

        {(fichas ?? []).length === 0 ? (
          <Card>
            <EmptyState
              icon={<TicketIcon />}
              title={q ? "Nada encontrado" : aba === "pendente" ? "Fila zerada" : "Nenhuma ficha aqui"}
              description={
                q
                  ? "Tenta outro nome ou número."
                  : aba === "pendente"
                    ? "Quando o admin liberar mais fichas, elas aparecem aqui."
                    : undefined
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {(fichas ?? []).map((f) => (
              <FichaCard key={f.id} ficha={f} rifaNome={f.rifa_nome} />
            ))}
          </div>
        )}

        {total > POR_PAGINA && (
          <Card>
            <Pagination pagina={pagina} porPagina={POR_PAGINA} total={total} href={(p) => montarQuery(BASE, filtros, { pagina: p })} />
          </Card>
        )}
      </main>
    </div>
  );
}
