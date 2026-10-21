import Link from "next/link";
import { CaretRightIcon, PhoneIcon, SealCheckIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
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
    ficha.qtd_numeros != null && `${formatNumero(ficha.qtd_numeros)} nº`,
    ficha.pagamento_valor != null && formatBRL(ficha.pagamento_valor),
  ].filter((d): d is string => typeof d === "string" && d.length > 0);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-colors duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]">
      {/* Top row: info + contact + actions in columns */}
      <div className="grid items-start gap-4 p-4 lg:grid-cols-[1fr_auto_1fr]">
        {/* Col 1: Identity */}
        <Link href={`/ligador/ficha/${ficha.id}`} className="group min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white/90">{ficha.nome}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[12.5px] tabular-nums text-white/40">
                {formatCPF(ficha.cpf)}
                {ficha.telefone && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="inline-flex items-center gap-1 text-white/35">
                      {ficha.telefone}
                      {ficha.telefone_confirmado && (
                        <SealCheckIcon size={13} weight="fill" className="text-[#4ade80]" aria-label="confirmado" />
                      )}
                    </span>
                  </>
                )}
              </p>
              {detalhes.length > 0 && (
                <p className="mt-1 text-[12px] text-white/30">
                  {detalhes.join(" · ")}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5 lg:hidden">
              <StatusBadge status={ficha.status} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 lg:mt-3">
            {(wa || tel) && (
              <div className="flex gap-1.5">
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-[#4ade80]/30 bg-[#4ade80]/10 px-3 text-[12px] font-medium text-[#4ade80] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors duration-200 hover:bg-[#4ade80]/15"
                  >
                    <WhatsappLogoIcon size={14} weight="fill" />
                    WhatsApp
                  </a>
                )}
                {tel && (
                  <a
                    href={tel}
                    aria-label="Ligar"
                    onClick={(e) => e.stopPropagation()}
                    className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-colors duration-200 hover:bg-white/[0.08] hover:text-white/60"
                  >
                    <PhoneIcon size={14} weight="fill" />
                  </a>
                )}
              </div>
            )}
            <span className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#7C3AED]/40 bg-[#7C3AED]/15 px-2.5 text-[12px] font-medium text-[#C4B5FD] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-transform duration-200 group-hover:translate-x-0.5">
              Ver ficha
              <CaretRightIcon size={12} weight="bold" />
            </span>
          </div>
        </Link>

        {/* Col 2: Status (desktop) + divider */}
        <div className="hidden items-center self-center lg:flex">
          <div className="mx-2 h-16 w-px bg-white/[0.06]" />
          <div className="flex flex-col items-center gap-1.5 px-3">
            <StatusBadge status={ficha.status} />
          </div>
          <div className="mx-2 h-16 w-px bg-white/[0.06]" />
        </div>

        {/* Col 3: Actions inline */}
        <div className="border-t border-white/[0.06] pt-3 lg:border-t-0 lg:pt-0">
          <FichaAcoes fichaId={ficha.id} status={ficha.status} observacao={ficha.observacao} compacto />
        </div>
      </div>
    </div>
  );
}
