import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  HeadsetIcon,
  HourglassMediumIcon,
  TicketIcon,
  UploadSimpleIcon,
  UsersThreeIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader, EmptyState } from "@/components/ui/Layout";
import { Stat, StatusBar } from "@/components/ui/Stats";
import { Card, CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNumero, formatRelativo } from "@/lib/format";
import type { LigadorResumo, RifaResumo } from "@/lib/types";

export default async function AdminHomePage() {
  await requireAdminSession();
  const supabase = createAdminClient();

  const [{ data: rifas }, { data: ligadores }] = await Promise.all([
    supabase
      .from("rifas_resumo")
      .select("*")
      .order("data_sorteio", { ascending: false, nullsFirst: false })
      .returns<RifaResumo[]>(),
    supabase
      .from("ligadores_resumo")
      .select("*")
      .eq("ativo", true)
      .order("pendentes", { ascending: false })
      .returns<LigadorResumo[]>(),
  ]);

  const listaRifas = rifas ?? [];
  const listaLigadores = ligadores ?? [];
  const soma = listaRifas.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      disponiveis: acc.disponiveis + r.disponiveis,
      naFila: acc.naFila + (r.pendente - r.disponiveis),
      deu_bom: acc.deu_bom + r.deu_bom,
      deu_ruim: acc.deu_ruim + r.deu_ruim,
    }),
    { total: 0, disponiveis: 0, naFila: 0, deu_bom: 0, deu_ruim: 0 },
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Visão geral"
        title="Operação"
        description="O que tem pra distribuir, o que está na mão dos ligadores e como está indo."
        actions={
          <ButtonLink href="/admin/rifas/importar" icon={<UploadSimpleIcon weight="bold" />}>
            Importar fichas
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Disponíveis" value={formatNumero(soma.disponiveis)} icon={<UsersThreeIcon />} tom="accent" footer="pra distribuir" />
        <Stat label="Na fila" value={formatNumero(soma.naFila)} icon={<HourglassMediumIcon />} tom="warning" footer="com ligador" />
        <Stat label="Deu bom" value={formatNumero(soma.deu_bom)} icon={<CheckCircleIcon />} />
        <Stat label="Deu ruim" value={formatNumero(soma.deu_ruim)} icon={<XCircleIcon />} tom="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Rifas"
            description={`${formatNumero(soma.total)} fichas em ${listaRifas.length} rifa(s)`}
            actions={
              <ButtonLink href="/admin/rifas" variant="ghost" size="sm" trailingIcon={<ArrowRightIcon size={14} weight="bold" />}>
                Ver todas
              </ButtonLink>
            }
          />
          {listaRifas.length === 0 ? (
            <EmptyState icon={<TicketIcon />} title="Nenhuma rifa ainda" description="Importe o .txt do checker." className="py-10" />
          ) : (
            <ul className="divide-y divide-line">
              {listaRifas.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/rifas/${r.id}`} className="flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-[13.5px] font-medium text-fg">{r.nome}</p>
                      <span className={`shrink-0 text-[12px] tabular-nums ${r.disponiveis > 0 ? "text-accent" : "text-fg-subtle"}`}>
                        {formatNumero(r.disponiveis)} disponíveis
                      </span>
                    </div>
                    <StatusBar contagem={r} altura="h-1.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Ligadores"
            description={`${listaLigadores.length} ativo(s)`}
            actions={
              <ButtonLink href="/admin/ligadores" variant="ghost" size="sm" trailingIcon={<ArrowRightIcon size={14} weight="bold" />}>
                Gerenciar
              </ButtonLink>
            }
          />
          {listaLigadores.length === 0 ? (
            <EmptyState icon={<HeadsetIcon />} title="Nenhum ligador ativo" description="Crie a equipe em Ligadores." className="py-10" />
          ) : (
            <ul className="divide-y divide-line">
              {listaLigadores.slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar nome={l.nome} fotoUrl={l.foto_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-fg">{l.nome}</p>
                    <p className="text-[12px] text-fg-subtle">
                      {l.ultima_atividade ? `Ativo ${formatRelativo(l.ultima_atividade)}` : "Sem atividade"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-[15px] tabular-nums ${l.pendentes > 0 ? "text-warning" : "text-fg-subtle"}`}>
                      {formatNumero(l.pendentes)}
                    </p>
                    <p className="text-[11px] text-fg-subtle">pendentes</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
