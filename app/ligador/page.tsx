import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutIcon, TicketIcon } from "@phosphor-icons/react/dist/ssr";
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
import { TransmissaoGate } from "./TransmissaoGate";

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
  if (aba === "fila") consulta = consulta.not("status", "in", `(${STATUS_RESOLVIDOS.join(",")})`);
  else if (aba === "retornar") consulta = consulta.eq("status", "retornar");
  else consulta = consulta.in("status", STATUS_RESOLVIDOS);
  const busca = normalizarBusca(q);
  if (busca) consulta = consulta.ilike("busca", `%${busca}%`);

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

  const semRetornar = /enum ficha_status/.test(erroLista?.message ?? "");
  const error = semRetornar && aba === "retornar" ? null : erroLista;
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
  const totalFichas = contagem.pendente + contagem.deu_bom + contagem.deu_ruim;
  const abas: { chave: Aba; label: string; n: number }[] = [
    { chave: "fila", label: "Fila", n: contagem.pendente },
    { chave: "retornar", label: "Retornar", n: retornar ?? 0 },
    { chave: "historico", label: "Histórico", n: contagem.deu_bom + contagem.deu_ruim },
  ];

  return (
    <div className="min-h-[100dvh] bg-black">
      {/* Header — MaxScale style: black/60 blur, subtle border */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-black/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href={BASE} aria-label="Início">
            <Image src="/familhao/logo.webp" alt="Familhão" width={130} height={30} priority className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <div className="flex size-7 items-center justify-center rounded-md bg-[#7C3AED]/30 text-xs font-bold text-[#C4B5FD]">
                {sessao.nome.charAt(0).toUpperCase()}
              </div>
              <span className="text-[13px] font-medium text-white/80">{sessao.nome}</span>
            </div>
            <form action={sairLigador}>
              <button
                type="submit"
                aria-label="Sair"
                title="Sair"
                className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
              >
                <SignOutIcon size={16} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-6">
        <TransmissaoGate ligadorId={sessao.ligadorId}>

        {/* Stats — MaxScale card style */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pendentes" value={contagem.pendente} color="#A855F7" />
          <StatCard label="Deu bom" value={contagem.deu_bom} color="#4ade80" />
          <StatCard label="Deu ruim" value={contagem.deu_ruim} color="#f1787d" />
        </div>

        {/* Progress bar */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="flex gap-1 overflow-hidden rounded-full">
            {totalFichas === 0 ? (
              <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]" />
            ) : (
              <>
                {contagem.pendente > 0 && <div className="h-1.5 rounded-full bg-[#A855F7]" style={{ flex: contagem.pendente }} />}
                {contagem.deu_bom > 0 && <div className="h-1.5 rounded-full bg-[#4ade80]" style={{ flex: contagem.deu_bom }} />}
                {contagem.deu_ruim > 0 && <div className="h-1.5 rounded-full bg-[#f1787d]" style={{ flex: contagem.deu_ruim }} />}
              </>
            )}
          </div>
          <div className="mt-2.5 flex gap-5 text-[11px] text-white/40">
            <span className="flex items-center gap-1.5"><span className="inline-block size-1.5 rounded-full bg-[#A855F7]" />Pendente</span>
            <span className="flex items-center gap-1.5"><span className="inline-block size-1.5 rounded-full bg-[#4ade80]" />Deu bom</span>
            <span className="flex items-center gap-1.5"><span className="inline-block size-1.5 rounded-full bg-[#f1787d]" />Deu ruim</span>
          </div>
        </div>

        {/* Tabs + search — MaxScale nav style */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex gap-1.5">
            {abas.map((a) => {
              const on = a.chave === aba;
              return (
                <Link
                  key={a.chave}
                  href={montarQuery(BASE, { q, aba: a.chave === "fila" ? "" : a.chave })}
                  scroll={false}
                  className={`flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[13px] font-medium transition-all duration-200 ${
                    on
                      ? "border-[#7C3AED]/60 bg-[#7C3AED]/30 text-[#C4B5FD] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                      : "border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                  }`}
                >
                  {a.label}
                  <span className={`font-mono text-[11px] tabular-nums ${on ? "text-[#C4B5FD]/70" : "text-white/30"}`}>{a.n}</span>
                </Link>
              );
            })}
          </nav>
          <div className="w-full sm:w-64">
            <SearchInput placeholder="Buscar nome, CPF ou telefone" />
          </div>
        </div>

        {/* List */}
        {(fichas ?? []).length === 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-10 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-[#7C3AED]/15 text-[#C4B5FD]">
              <TicketIcon size={24} />
            </div>
            <p className="text-base font-semibold text-white/90">
              {q ? "Nada encontrado" : aba === "fila" ? "Fila zerada" : aba === "retornar" ? "Ninguém pra retornar" : "Histórico vazio"}
            </p>
            <p className="mt-1.5 text-[13px] text-white/40">
              {q
                ? "Tenta outro nome ou número."
                : aba === "fila"
                  ? "Quando o admin liberar mais fichas, elas aparecem aqui."
                  : aba === "retornar"
                    ? "As fichas que você marcar como 'Retornar' ficam aqui e no topo da fila."
                    : "Tudo que você marcar como deu bom ou deu ruim sai da fila e fica aqui."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {(fichas ?? []).map((f) => (
              <FichaCard key={f.id} ficha={f} />
            ))}
          </div>
        )}

        {total > POR_PAGINA && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <Pagination pagina={pagina} porPagina={POR_PAGINA} total={total} href={(p) => montarQuery(BASE, filtros, { pagina: p })} />
          </div>
        )}
        </TransmissaoGate>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/40">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums" style={{ color }}>
        {formatNumero(value)}
      </p>
    </div>
  );
}
