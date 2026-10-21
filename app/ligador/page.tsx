import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutIcon, TicketIcon } from "@phosphor-icons/react/dist/ssr";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
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
  const abas: { chave: Aba; label: string; n: number }[] = [
    { chave: "fila", label: "Fila", n: contagem.pendente },
    { chave: "retornar", label: "Retornar", n: retornar ?? 0 },
    { chave: "historico", label: "Histórico", n: contagem.deu_bom + contagem.deu_ruim },
  ];

  return (
    <div className="theme-familhao min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-white/15 bg-[#5300AA]/90 px-4 py-3.5 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href={BASE} aria-label="Início">
            <Image src="/familhao/logo.webp" alt="Familhão" width={130} height={30} priority className="h-7 w-auto sm:h-8" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar nome={sessao.nome} size="sm" />
              <span className="hidden text-[13.5px] font-medium text-white/90 sm:inline">{sessao.nome}</span>
            </div>
            <form action={sairLigador}>
              <button
                type="submit"
                aria-label="Sair"
                title="Sair"
                className="flex size-8 items-center justify-center rounded-full text-white/50 transition-colors duration-300 hover:bg-white/10 hover:text-white"
              >
                <SignOutIcon size={17} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
        <TransmissaoGate ligadorId={sessao.ligadorId}>

        <div className="animate-fade-up rounded-3xl border border-[#D04AFF]/30 bg-[#2D0A57]/80 px-5 py-4 backdrop-blur-sm [animation-delay:40ms]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#DFC0FF]">Sua fila</p>
              <p className="mt-1 font-mono text-[34px] font-medium leading-none tracking-[-0.04em] tabular-nums text-white">
                {formatNumero(contagem.pendente)}
                <span className="ml-2 text-[14px] font-normal tracking-normal text-white/60">pendentes</span>
              </p>
            </div>
            <p className="text-right text-[12.5px] text-white/50">
              {formatNumero(contagem.deu_bom)} deu bom
              <br />
              {formatNumero(contagem.deu_ruim)} deu ruim
            </p>
          </div>
          <div className="mt-4 flex gap-1 overflow-hidden rounded-full">
            {(() => {
              const t = contagem.pendente + contagem.deu_bom + contagem.deu_ruim;
              if (t === 0) return <div className="h-2 flex-1 rounded-full bg-white/10" />;
              return (
                <>
                  {contagem.pendente > 0 && <div className="h-2 rounded-full bg-[#D04AFF]" style={{ flex: contagem.pendente }} />}
                  {contagem.deu_bom > 0 && <div className="h-2 rounded-full bg-[#4ade80]" style={{ flex: contagem.deu_bom }} />}
                  {contagem.deu_ruim > 0 && <div className="h-2 rounded-full bg-[#f1787d]" style={{ flex: contagem.deu_ruim }} />}
                </>
              );
            })()}
          </div>
          <div className="mt-2 flex gap-4 text-[11px] text-white/50">
            <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-[#D04AFF]" />Pendente</span>
            <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-[#4ade80]" />Deu bom</span>
            <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-[#f1787d]" />Deu ruim</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {abas.map((a) => {
              const on = a.chave === aba;
              return (
                <Link
                  key={a.chave}
                  href={montarQuery(BASE, { q, aba: a.chave === "fila" ? "" : a.chave })}
                  scroll={false}
                  className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors duration-300 ${
                    on
                      ? "border-[#D04AFF]/50 bg-[#D04AFF]/20 text-[#E498FF]"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  {a.label}
                  <span className={`font-mono text-[11.5px] tabular-nums ${on ? "text-[#E498FF]" : "text-white/40"}`}>{a.n}</span>
                </Link>
              );
            })}
          </nav>
          <SearchInput placeholder="Buscar por nome, CPF ou telefone" />
        </div>

        {(fichas ?? []).length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#2D0A57]/60 p-8 text-center backdrop-blur-sm">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#D04AFF]/15 text-[#DFC0FF]">
              <TicketIcon size={24} />
            </div>
            <p className="text-lg font-bold text-white">
              {q ? "Nada encontrado" : aba === "fila" ? "Fila zerada" : aba === "retornar" ? "Ninguém pra retornar" : "Histórico vazio"}
            </p>
            <p className="mt-1 text-sm text-white/50">
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
        </TransmissaoGate>
      </main>
    </div>
  );
}
