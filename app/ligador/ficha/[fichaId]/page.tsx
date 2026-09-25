import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CakeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  IdentificationCardIcon,
  PhoneIcon,
  ReceiptIcon,
  SealCheckIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Layout";
import { requireLigadorSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL, formatCPF, formatDataHora, formatNumero, formatRelativo, telHref, whatsappHref } from "@/lib/format";
import type { Compra, Ficha, FichaStatus } from "@/lib/types";
import { FichaAcoes } from "../../FichaAcoes";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface FichaDetalhe extends Ficha {
  rifas: { nome: string } | null;
}
interface LogLinha {
  id: string;
  status_anterior: FichaStatus | null;
  status_novo: FichaStatus;
  observacao: string | null;
  created_at: string;
  ligadores: { nome: string } | null;
}

export default async function FichaPage({ params }: { params: Promise<{ fichaId: string }> }) {
  const [sessao, { fichaId }] = await Promise.all([requireLigadorSession(), params]);
  if (!UUID.test(fichaId)) notFound();
  const supabase = createAdminClient();

  // A service role ignora RLS: a checagem de acesso é esta.
  const { data: acesso } = await supabase
    .from("ligador_acesso")
    .select("id")
    .eq("ligador_id", sessao.ligadorId)
    .eq("ficha_id", fichaId)
    .maybeSingle();
  if (!acesso) notFound();

  const [{ data: ficha }, { data: historico }] = await Promise.all([
    supabase.from("fichas").select("*, rifas(nome)").eq("id", fichaId).maybeSingle<FichaDetalhe>(),
    supabase
      .from("ficha_status_log")
      .select("id, status_anterior, status_novo, observacao, created_at, ligadores(nome)")
      .eq("ficha_id", fichaId)
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<LogLinha[]>(),
  ]);
  if (!ficha) notFound();

  // `compras` só existe depois da migration 0007.
  const compras: Compra[] = Array.isArray(ficha.compras) ? ficha.compras : [];
  const totalNumeros = compras.reduce<number | null>((s, c) => (c.qtd_numeros == null ? s : (s ?? 0) + c.qtd_numeros), null) ?? ficha.qtd_numeros;
  const totalPago = compras.reduce<number | null>((s, c) => (c.pagamento_valor == null ? s : (s ?? 0) + c.pagamento_valor), null) ?? ficha.pagamento_valor;
  const wa = whatsappHref(ficha.telefone);
  const tel = telHref(ficha.telefone);

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/ligador"
            className="inline-flex h-9 items-center gap-1.5 rounded-full pr-3.5 pl-2.5 text-[13.5px] font-medium text-fg-muted transition-colors duration-300 ease-spring hover:bg-white/[0.05] hover:text-fg"
          >
            <ArrowLeftIcon size={16} weight="bold" />
            Fila
          </Link>
          <StatusBadge status={ficha.status} />
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6">
        <section className="animate-fade-up">
          {ficha.rifas?.nome && (
            <p className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">{ficha.rifas.nome}</p>
          )}
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-fg">{ficha.nome}</h1>
          {(wa || tel) && (
            <div className="mt-4 flex gap-2">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent text-[15px] font-medium text-accent-fg shadow-accent transition-[background-color,transform] duration-300 ease-spring hover:bg-accent-strong active:scale-[0.98]"
                >
                  <WhatsappLogoIcon size={20} weight="fill" />
                  WhatsApp
                </a>
              )}
              {tel && (
                <a
                  href={tel}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface-2 px-5 text-[15px] font-medium text-fg transition-colors duration-300 ease-spring hover:bg-surface-3 active:scale-[0.98]"
                >
                  <PhoneIcon size={18} weight="fill" />
                  Ligar
                </a>
              )}
            </div>
          )}
        </section>

        <Card className="animate-fade-up [animation-delay:40ms]">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-5">
            <Dado icon={<IdentificationCardIcon />} label="CPF" mono>
              {formatCPF(ficha.cpf)}
            </Dado>
            <Dado icon={<PhoneIcon />} label="Telefone" mono>
              {ficha.telefone ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  {ficha.telefone}
                  {ficha.telefone_confirmado && (
                    <Badge tom="accent" icon={<SealCheckIcon weight="fill" />}>
                      confirmado
                    </Badge>
                  )}
                </span>
              ) : (
                "—"
              )}
            </Dado>
            <Dado icon={<CakeIcon />} label="Idade">
              {ficha.idade != null ? `${ficha.idade} anos` : "—"}
            </Dado>
            <Dado icon={<BriefcaseIcon />} label="Profissão">
              {ficha.profissao ?? "—"}
            </Dado>
            <Dado icon={<CurrencyDollarIcon />} label="Renda" mono>
              {formatBRL(ficha.renda)}
            </Dado>
            {ficha.cidade && (
              <Dado icon={<MapPinIcon />} label="Cidade">
                {ficha.cidade}
              </Dado>
            )}
            {ficha.nascimento && (
              <Dado icon={<CalendarIcon />} label="Nascimento" mono>
                {ficha.nascimento.split("-").reverse().join("/")}
              </Dado>
            )}
            <Dado icon={<ReceiptIcon />} label="Comprou" mono>
              {compras.length > 0 || totalNumeros != null
                ? `${formatNumero(totalNumeros ?? 0)} número${totalNumeros === 1 ? "" : "s"} · ${formatBRL(totalPago)}`
                : "—"}
            </Dado>
          </dl>
        </Card>

        <Card className="animate-fade-up [animation-delay:80ms]">
          <CardHeader title="Como foi o contato" description="Marca aqui depois de falar com a pessoa" />
          <div className="p-5">
            <FichaAcoes fichaId={ficha.id} status={ficha.status} observacao={ficha.observacao} />
          </div>
        </Card>

        <Card className="animate-fade-up [animation-delay:120ms]">
          <CardHeader
            title={`Compras${compras.length ? ` (${compras.length})` : ""}`}
            description={
              compras.length
                ? `${formatNumero(totalNumeros ?? 0)} número(s) no total · ${formatBRL(totalPago)}`
                : "O que a pessoa comprou nesta rifa"
            }
          />
          {compras.length === 0 ? (
            <EmptyState
              icon={<ReceiptIcon />}
              title="Sem detalhe das compras"
              description="Essa ficha foi importada antes de o detalhe ser guardado. Reimportar o arquivo preenche."
              className="py-10"
            />
          ) : (
            <ul className="divide-y divide-line">
              {compras.map((c, i) => (
                <li key={c.pedido ?? i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-[14px] font-medium text-fg">{c.titulo ?? "Compra"}</p>
                    <span className="shrink-0 font-mono text-[14px] tabular-nums text-fg">{formatBRL(c.pagamento_valor)}</span>
                  </div>
                  <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
                    <Linha label="Números">{c.qtd_numeros != null ? formatNumero(c.qtd_numeros) : "—"}</Linha>
                    <Linha label="Pedido" mono>
                      {c.pedido ?? "—"}
                    </Linha>
                    <Linha label="Comprado em">{formatDataHora(c.comprado_em)}</Linha>
                    <Linha label="Pagamento">
                      {[c.pagamento_metodo, c.pagamento_status].filter(Boolean).join(" · ") || "—"}
                      {c.pagamento_pago_em && (
                        <span className="block text-fg-subtle">pago {formatDataHora(c.pagamento_pago_em)}</span>
                      )}
                    </Linha>
                    <Linha label="Prêmio">{c.premio ?? "—"}</Linha>
                    <Linha label="Sorteio">{formatDataHora(c.sorteio_em)}</Linha>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="animate-fade-up [animation-delay:160ms]">
          <CardHeader title="Histórico" description="Quem marcou o quê, e quando" />
          {(historico ?? []).length === 0 ? (
            <p className="px-5 py-5 text-[13.5px] text-fg-subtle">Ninguém marcou essa ficha ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(historico ?? []).map((h) => (
                <li key={h.id} className="flex items-start gap-3 px-5 py-3.5">
                  <StatusBadge status={h.status_novo} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] text-fg">
                      {h.ligadores?.nome ?? "—"}
                      <span className="text-fg-subtle"> · {formatRelativo(h.created_at)}</span>
                    </p>
                    {h.observacao && <p className="mt-0.5 text-[13px] text-fg-muted">“{h.observacao}”</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}

function Dado({ icon, label, mono, children }: { icon: ReactNode; label: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
        <span className="text-[14px]">{icon}</span>
        {label}
      </dt>
      <dd className={`mt-1 text-[14.5px] text-fg ${mono ? "font-mono tabular-nums" : ""}`}>{children}</dd>
    </div>
  );
}

function Linha({ label, mono, children }: { label: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className={`mt-0.5 text-fg-muted ${mono ? "font-mono tabular-nums" : ""}`}>{children}</dd>
    </div>
  );
}
