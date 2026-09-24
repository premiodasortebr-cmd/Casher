import Link from "next/link";
import { CaretRightIcon, PhoneIcon, SealCheckIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatBRL, formatCPF, formatNumero, telHref, whatsappHref } from "@/lib/format";
import type { FichaLista } from "@/lib/types";
import { FichaAcoes } from "./FichaAcoes";

export function FichaCard({ ficha }: { ficha: FichaLista }) {
  const wa = whatsappHref(ficha.telefone);
  const tel = telHref(ficha.telefone);
  const detalhes = [
    ficha.idade != null && `${ficha.idade} anos`,
    ficha.profissao,
    ficha.qtd_compras != null && `${ficha.qtd_compras} compra${ficha.qtd_compras === 1 ? "" : "s"}`,
    ficha.qtd_numeros != null && `${formatNumero(ficha.qtd_numeros)} número${ficha.qtd_numeros === 1 ? "" : "s"}`,
    ficha.pagamento_valor != null && formatBRL(ficha.pagamento_valor),
  ].filter((d): d is string => typeof d === "string" && d.length > 0);

  return (
    <Card className="overflow-hidden">
      <Link
        href={`/ligador/ficha/${ficha.id}`}
        className="group flex items-start gap-3 p-4 transition-colors duration-300 ease-spring hover:bg-white/[0.03]"
      >
        <div className="min-w-0 flex-1">
          <p className="mb-1 truncate text-[11px] uppercase tracking-[0.12em] text-fg-subtle">{ficha.rifa_nome}</p>
          <p className="font-medium text-fg">{ficha.nome}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[12.5px] tabular-nums text-fg-subtle">
            {formatCPF(ficha.cpf)}
            {ficha.telefone && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-fg-muted">
                  {ficha.telefone}
                  {ficha.telefone_confirmado && (
                    <SealCheckIcon size={13} weight="fill" className="text-accent" aria-label="telefone confirmado" />
                  )}
                </span>
              </>
            )}
          </p>
          {detalhes.length > 0 && (
            <p className="mt-1.5 text-[12px] text-fg-muted">
              {detalhes.map((d, i) => (
                <span key={d}>
                  {i > 0 && <span className="mx-1.5 text-fg-subtle">·</span>}
                  {d}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={ficha.status} />
          <span className="inline-flex h-7 items-center gap-1 rounded-full bg-accent-soft pr-2 pl-2.5 text-[12px] font-medium text-accent">
            Ver tudo
            <CaretRightIcon size={12} weight="bold" className="transition-transform duration-300 ease-spring group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>

      <div className="flex flex-col gap-2.5 px-4 pb-4">
        {(wa || tel) && (
          <div className="flex gap-2">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-accent-line bg-accent-soft text-[13px] font-medium text-accent transition-colors duration-300 ease-spring hover:bg-accent/15 active:scale-[0.98]"
              >
                <WhatsappLogoIcon size={17} weight="fill" />
                WhatsApp
              </a>
            )}
            {tel && (
              <a
                href={tel}
                aria-label="Ligar"
                title="Ligar"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-2 text-fg-muted transition-colors duration-300 ease-spring hover:bg-surface-3 hover:text-fg active:scale-[0.96]"
              >
                <PhoneIcon size={16} weight="fill" />
              </a>
            )}
          </div>
        )}
        <FichaAcoes fichaId={ficha.id} status={ficha.status} observacao={ficha.observacao} compacto />
      </div>
    </Card>
  );
}
