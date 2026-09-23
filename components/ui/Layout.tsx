import type { ReactNode } from "react";
import { Eyebrow } from "./Badge";

/** Cabeçalho de página: eyebrow + título grande + descrição + ações à direita. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="flex animate-fade-up flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && <div className="mb-4">{back}</div>}
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-fg md:text-[34px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className ?? ""}`}
    >
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-line-strong bg-surface-2 text-[26px] text-fg-muted shadow-bezel">
        {icon}
      </div>
      <p className="text-[15px] font-medium text-fg">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-fg-subtle">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

type TomAlerta = "danger" | "warning" | "accent" | "neutral";

const tonsAlerta: Record<TomAlerta, string> = {
  danger: "border-danger-line bg-danger-soft text-danger",
  warning: "border-warning-line bg-warning-soft text-warning",
  accent: "border-accent-line bg-accent-soft text-accent",
  neutral: "border-line-strong bg-white/[0.03] text-fg-muted",
};

export function Alert({
  tom = "danger",
  icon,
  children,
  className,
}: {
  tom?: TomAlerta;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tom === "danger" ? "alert" : "status"}
      className={`flex animate-fade-in items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13.5px] leading-relaxed ${tonsAlerta[tom]} ${className ?? ""}`}
    >
      {icon && <span className="mt-0.5 flex shrink-0 text-base">{icon}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-lg bg-[linear-gradient(90deg,rgb(255_255_255/0.03)_0%,rgb(255_255_255/0.07)_50%,rgb(255_255_255/0.03)_100%)] bg-[length:200%_100%] ${className ?? ""}`}
    />
  );
}
