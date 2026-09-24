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
import { montarQuery, normalizarBusca, pagina as lerPagina, texto, type SearchParams } from "@/lib/listagem";
import { STATUS_RESOLVIDOS, type FichaLista, type LigadorResumo } from "@/lib/types";

type Aba = "fila" | "retornar" | "historico";
import { FichaCard } from "./FichaCard";

const BASE = "/ligador";
const POR_PAGINA = 20;

export default async function LigadorHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [sessao, sp] = await Promise.all([requireLigadorSession(), searchParams]);
  const supabase = createAdminClient();

  const q = texto(sp, "q");
  const abaBruta = texto(sp, "aba");
  const aba: Aba = abaBruta === "retornar" || abaBruta === "historico" ? abaBruta : "fila";
  const pagina = lerPagina(sp);
  const filtros = { q, aba: aba === "fila" ? "" : aba };

  let consulta = supabase
    .from("fichas_lista")
    .select("*", { count: "exact" })
    .eq("ligador_id", sessao.ligadorId);
  // "Fila" é escrita como NÃO-resolvida: assim funciona mesmo antes da migration
  // 0008 (o banco só conhece 'retornar' depois dela).
  if (aba === "fila") consulta = consulta.not("status", "in", `(${STATUS_RESOLVIDOS.join(",")})`);
  else if (aba === "retornar") consulta = consulta.eq("status", "retornar");
  else consulta = consulta.in("status", STATUS_RESOLVIDOS);
  const busca = normalizarBusca(q);
  if (busca) consulta = consulta.ilike("busca", `%${busca}%`);

  // Na fila, quem pediu pra retornar vem antes de quem ainda não foi ligado; no
  // histórico, o que foi marcado por último vem primeiro.
  if (aba === "fila") consulta = consulta.order("status", { ascending: false });
  if (aba === "historico") consulta = consulta.order("status_atualizado_em", { ascending: false, nullsFirst: false });

  const de = (pagina - 1) * POR_PAGINA;
  const [{ data: fichas, count, error: erroLista }, { data: resumo }, { count: retornar }] = await Promise.all([
    consulta.order("nome").range(de, de + POR_PAGINA - 1).returns<FichaLista[]>(),
    supabase.from("ligadores_resumo").select("*").eq("id", sessao.ligadorId).maybeSingle<LigadorResumo>(),
    supabase
      .from("fichas_lista")
      .select("id", { count: "exact", head: true })
      .eq("ligador_id", sessao.ligadorId)
      .eq("status", "retornar"),
  ]);

  // Banco ainda sem o status 'retornar' (migration 0008 não colada): aba vazia, sem quebrar.
  const semRetornar = /enum ficha_status/.test(erroLista?.message ?? "");
  const error = semRetornar && aba === "retornar" ? null : erroLista;
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
  const abas: { chave: Aba; label: string; n: number }[] = [
    { chave: "fila", label: "Fila", n: contagem.pendente },
    { chave: "retornar", label: "Retornar", n: retornar ?? 0 },
    { chave: "historico", label: "Histórico", n: contagem.deu_bom + contagem.deu_ruim },
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
                  href={montarQuery(BASE, { q, aba: a.chave === "fila" ? "" : a.chave })}
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
              title={
                q
                  ? "Nada encontrado"
                  : aba === "fila"
                    ? "Fila zerada"
                    : aba === "retornar"
                      ? "Ninguém pra retornar"
                      : "Histórico vazio"
              }
              description={
                q
                  ? "Tenta outro nome ou número."
                  : aba === "fila"
                    ? "Quando o admin liberar mais fichas, elas aparecem aqui."
                    : aba === "retornar"
                      ? "As fichas que você marcar como 'Retornar' ficam aqui e no topo da fila."
                      : "Tudo que você marcar como deu bom ou deu ruim sai da fila e fica aqui."
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {(fichas ?? []).map((f) => (
              <FichaCard key={f.id} ficha={f} />
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
