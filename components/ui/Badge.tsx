import type { ReactNode } from "react";
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  HourglassMediumIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { FichaStatus } from "@/lib/types";

type Tom = "neutral" | "accent" | "danger" | "warning";

const tons: Record<Tom, string> = {
  neutral: "border-line-strong bg-white/[0.04] text-fg-muted",
  accent: "border-accent-line bg-accent-soft text-accent",
  danger: "border-danger-line bg-danger-soft text-danger",
  warning: "border-warning-line bg-warning-soft text-warning",
};

export function Badge({
  tom = "neutral",
  icon,
  children,
  className,
}: {
  tom?: Tom;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-medium ${tons[tom]} ${className ?? ""}`}
    >
      {icon && <span className="-ml-0.5 flex text-[13px]">{icon}</span>}
      {children}
    </span>
  );
}

/** Tag microscópica acima de títulos grandes. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white/[0.03] px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-fg-muted ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

export const STATUS_INFO: Record<
  FichaStatus,
  { label: string; tom: Tom; Icone: typeof CheckCircleIcon }
> = {
  pendente: { label: "Pendente", tom: "warning", Icone: HourglassMediumIcon },
  retornar: { label: "Retornar", tom: "neutral", Icone: ArrowClockwiseIcon },
  deu_bom: { label: "Deu bom", tom: "accent", Icone: CheckCircleIcon },
  deu_ruim: { label: "Deu ruim", tom: "danger", Icone: XCircleIcon },
};

export function StatusBadge({ status, className }: { status: FichaStatus; className?: string }) {
  const { label, tom, Icone } = STATUS_INFO[status];
  return (
    <Badge tom={tom} icon={<Icone weight="fill" />} className={className}>
      {label}
    </Badge>
  );
}
