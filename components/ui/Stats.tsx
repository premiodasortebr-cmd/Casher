import type { ReactNode } from "react";
import { porcentagem } from "@/lib/format";

/** KPI: rótulo pequeno, número grande tabular, rodapé opcional. */
export function Stat({
  label,
  value,
  icon,
  footer,
  tom = "neutral",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  tom?: "neutral" | "accent" | "danger" | "warning";
  className?: string;
}) {
  const corValor = {
    neutral: "text-fg",
    accent: "text-accent",
    danger: "text-danger",
    warning: "text-warning",
  }[tom];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-bezel ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-fg-muted">{label}</span>
        {icon && <span className="flex text-lg text-fg-subtle">{icon}</span>}
      </div>
      <div
        className={`mt-3 font-mono text-[32px] font-medium leading-none tracking-[-0.04em] tabular-nums ${corValor}`}
      >
        {value}
      </div>
      {footer && <div className="mt-3 text-[12.5px] text-fg-subtle">{footer}</div>}
    </div>
  );
}

export interface ContagemStatus {
  deu_bom: number;
  deu_ruim: number;
  pendente: number;
}

/**
 * Barra empilhada bom / ruim / pendente. Os segmentos têm 2px de respiro entre si
 * e cantos arredondados — pendente fica como trilho neutro, não como cor.
 */
export function StatusBar({
  contagem,
  className,
  altura = "h-2",
}: {
  contagem: ContagemStatus;
  className?: string;
  altura?: string;
}) {
  const total = contagem.deu_bom + contagem.deu_ruim + contagem.pendente;
  const bom = porcentagem(contagem.deu_bom, total);
  const ruim = porcentagem(contagem.deu_ruim, total);
  return (
    <div
      role="img"
      aria-label={`${contagem.deu_bom} deu bom, ${contagem.deu_ruim} deu ruim, ${contagem.pendente} pendentes`}
      className={`flex w-full gap-[2px] overflow-hidden rounded-full bg-white/[0.06] ${altura} ${className ?? ""}`}
    >
      {contagem.deu_bom > 0 && (
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-spring"
          style={{ width: `${Math.max(bom, 2)}%` }}
        />
      )}
      {contagem.deu_ruim > 0 && (
        <div
          className="h-full rounded-full bg-danger transition-[width] duration-700 ease-spring"
          style={{ width: `${Math.max(ruim, 2)}%` }}
        />
      )}
    </div>
  );
}

/** Legenda compacta pra acompanhar a StatusBar. */
export function StatusLegenda({ contagem }: { contagem: ContagemStatus }) {
  const itens = [
    { label: "Deu bom", valor: contagem.deu_bom, cor: "bg-accent" },
    { label: "Deu ruim", valor: contagem.deu_ruim, cor: "bg-danger" },
    { label: "Pendente", valor: contagem.pendente, cor: "bg-white/20" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-fg-subtle">
      {itens.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${i.cor}`} />
          {i.label}
          <span className="font-mono tabular-nums text-fg-muted">{i.valor}</span>
        </span>
      ))}
    </div>
  );
}
