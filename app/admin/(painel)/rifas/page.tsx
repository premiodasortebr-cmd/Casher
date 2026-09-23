import Link from "next/link";
import { CalendarIcon, CaretRightIcon, TicketIcon, UploadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader, EmptyState } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBar } from "@/components/ui/Stats";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL, formatDataHora, formatNumero } from "@/lib/format";
import type { RifaResumo } from "@/lib/types";

export default async function RifasPage() {
  await requireAdminSession();

  const { data: rifas } = await createAdminClient()
    .from("rifas_resumo")
    .select("*")
    .order("data_sorteio", { ascending: false, nullsFirst: false })
    .returns<RifaResumo[]>();

  const lista = rifas ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Rifas"
        title="Todas as rifas"
        description="Entre numa rifa pra distribuir fichas entre os ligadores e acompanhar o progresso."
        actions={
          <ButtonLink href="/admin/rifas/importar" icon={<UploadSimpleIcon weight="bold" />}>
            Importar fichas
          </ButtonLink>
        }
      />

      {lista.length === 0 ? (
        <Card>
          <EmptyState
            icon={<TicketIcon />}
            title="Nenhuma rifa cadastrada"
            description="Importe o .txt do checker pra criar as rifas e as fichas."
            action={
              <ButtonLink href="/admin/rifas/importar" icon={<UploadSimpleIcon weight="bold" />}>
                Importar fichas
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {lista.map((r) => (
            <Link
              key={r.id}
              href={`/admin/rifas/${r.id}`}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors duration-300 ease-spring hover:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_14rem_auto]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-fg">{r.nome}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-subtle">
                  {r.premio_valor != null && <span>{formatBRL(r.premio_valor)}</span>}
                  {r.data_sorteio && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon size={13} />
                      {formatDataHora(r.data_sorteio)}
                    </span>
                  )}
                </div>
              </div>

              <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
                <StatusBar contagem={r} altura="h-1.5" />
                <p className="text-[12px] tabular-nums text-fg-subtle">
                  <span className="text-fg-muted">{formatNumero(r.total)}</span> fichas ·{" "}
                  <span className={r.disponiveis > 0 ? "text-accent" : ""}>{formatNumero(r.disponiveis)} disponíveis</span>
                  {" · "}
                  {formatNumero(r.pendente - r.disponiveis)} na fila
                </p>
              </div>

              <CaretRightIcon
                size={16}
                className="col-start-2 row-start-1 text-fg-subtle transition-transform duration-300 ease-spring group-hover:translate-x-0.5 md:col-start-3"
              />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
