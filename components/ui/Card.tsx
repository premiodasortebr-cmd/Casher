import type { ComponentProps, ReactNode } from "react";

/** Painel padrão: superfície grafite, hairline e brilho interno no topo. */
export function Card({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-bezel ${className ?? ""}`}
      {...rest}
    />
  );
}

/**
 * "Double-bezel": casca externa translúcida + núcleo com raio concêntrico.
 * Para peças de destaque (login, KPIs principais, setup) — não para listas longas.
 */
export function BezelCard({
  className,
  innerClassName,
  children,
}: {
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[1.75rem] bg-white/[0.025] p-1.5 ring-1 ring-white/[0.07] ${className ?? ""}`}
    >
      <div
        className={`rounded-[calc(1.75rem-0.375rem)] bg-surface shadow-[inset_0_1px_0_0_rgb(255_255_255/0.07)] ${innerClassName ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-line px-5 py-4 ${className ?? ""}`}
    >
      <div className="min-w-0">
        <h2 className="text-[15px] font-medium tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-fg-subtle">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
