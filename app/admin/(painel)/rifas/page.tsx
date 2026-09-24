import Link from "next/link";
import { CaretRightIcon, TicketIcon, UploadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/Layout";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBar } from "@/components/ui/Stats";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNumero } from "@/lib/format";
import type { RifaResumo } from "@/lib/types";
import { NovaRifaCard } from "./NovaRifaCard";

export default async function RifasPage() {
  await requireAdminSession();

  const { data: rifas } = await createAdminClient()
    .from("rifas_resumo")
    .select("*")
    .order("nome")
    .returns<RifaResumo[]>();
  const lista = rifas ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Rifas"
        title="Suas rifas"
        description="Cada rifa junta as fichas de todos os arquivos que você subir pra ela. Entre numa rifa pra distribuir entre os ligadores."
        actions={
          lista.length > 0 && (
            <ButtonLink href="/admin/rifas/importar" icon={<UploadSimpleIcon weight="bold" />}>
              Importar fichas
            </ButtonLink>
          )
        }
      />

      {lista.length === 0 && (
        <p className="-mt-2 text-[14px] text-fg-muted">
          Comece criando a primeira rifa — depois é só subir o .txt do checker pra ela.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((r, i) => (
          <CardRifa key={r.id} rifa={r} indice={i} />
        ))}
        <NovaRifaCard inicialAberto={lista.length === 0} />
      </div>
    </div>
  );
}

function CardRifa({ rifa: r, indice }: { rifa: RifaResumo; indice: number }) {
  const naFila = r.pendente - r.disponiveis;
  return (
    <Link
      href={`/admin/rifas/${r.id}`}
      style={{ animationDelay: `${Math.min(indice, 8) * 40}ms` }}
      className="group flex min-h-[184px] animate-fade-up flex-col justify-between gap-5 rounded-2xl border border-line bg-surface p-5 shadow-bezel transition-[border-color,background-color,transform] duration-300 ease-spring hover:-translate-y-0.5 hover:border-white/15 hover:bg-surface-2"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <TicketIcon size={20} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold tracking-tight text-fg">{r.nome}</p>
          <p className="text-[12.5px] tabular-nums text-fg-subtle">
            {r.total === 0 ? "Nenhuma ficha ainda" : `${formatNumero(r.total)} fichas`}
          </p>
        </div>
        <CaretRightIcon
          size={16}
          className="mt-1 shrink-0 text-fg-subtle transition-transform duration-300 ease-spring group-hover:translate-x-0.5 group-hover:text-fg-muted"
        />
      </div>

      {r.total === 0 ? (
        <p className="flex items-center gap-1.5 text-[13px] text-fg-muted">
          <UploadSimpleIcon size={14} />
          Suba um .txt pra começar
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <StatusBar contagem={r} altura="h-1.5" />
          <dl className="grid grid-cols-3 gap-2">
            <Mini label="Disponíveis" valor={r.disponiveis} cor={r.disponiveis > 0 ? "text-accent" : "text-fg-subtle"} />
            <Mini label="Na fila" valor={naFila} cor={naFila > 0 ? "text-warning" : "text-fg-subtle"} />
            <Mini label="Deu bom" valor={r.deu_bom} cor="text-fg" />
          </dl>
        </div>
      )}
    </Link>
  );
}

function Mini({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div>
      <dt className="text-[11px] text-fg-subtle">{label}</dt>
      <dd className={`font-mono text-[17px] font-medium tabular-nums tracking-[-0.02em] ${cor}`}>{formatNumero(valor)}</dd>
    </div>
  );
}
