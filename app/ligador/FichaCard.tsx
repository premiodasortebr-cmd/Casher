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
    ficha.qtd_numeros != null && `${formatNumero(ficha.qtd_numeros)} número${ficha.qtd_numeros === 1 ? "" : "s"}`,
    ficha.pagamento_valor != null && formatBRL(ficha.pagamento_valor),
  ].filter((d): d is string => typeof d === "string" && d.length > 0);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-colors duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]">
      <Link
        href={`/ligador/ficha/${ficha.id}`}
        className="group flex items-start gap-3 p-4"
      >
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
                    <SealCheckIcon size={13} weight="fill" className="text-[#4ade80]" aria-label="telefone confirmado" />
                  )}
                </span>
              </>
            )}
          </p>
          {detalhes.length > 0 && (
            <p className="mt-1.5 text-[12px] text-white/30">
              {detalhes.map((d, i) => (
                <span key={d}>
                  {i > 0 && <span className="mx-1.5 text-white/15">·</span>}
                  {d}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={ficha.status} />
          <span className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#7C3AED]/40 bg-[#7C3AED]/15 px-2.5 text-[12px] font-medium text-[#C4B5FD] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            Ver tudo
            <CaretRightIcon size={12} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>

      <div className="flex flex-col gap-2.5 border-t border-white/[0.06] px-4 py-3">
        {(wa || tel) && (
          <div className="flex gap-2">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#4ade80]/30 bg-[#4ade80]/10 text-[13px] font-medium text-[#4ade80] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors duration-200 hover:bg-[#4ade80]/15 active:scale-[0.98]"
              >
                <WhatsappLogoIcon size={16} weight="fill" />
                WhatsApp
              </a>
            )}
            {tel && (
              <a
                href={tel}
                aria-label="Ligar"
                title="Ligar"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-colors duration-200 hover:bg-white/[0.08] hover:text-white/60 active:scale-[0.96]"
              >
                <PhoneIcon size={15} weight="fill" />
              </a>
            )}
          </div>
        )}
        <FichaAcoes fichaId={ficha.id} status={ficha.status} observacao={ficha.observacao} compacto />
      </div>
    </div>
  );
}
