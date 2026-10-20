import type { ComponentProps, ReactNode } from "react";

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-3xl border border-white/[0.09] bg-surface shadow-bezel backdrop-blur-md ${className ?? ""}`}
      {...rest}
    />
  );
}

export function GlowCard({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-3xl border border-white/[0.09] bg-surface shadow-accent backdrop-blur-md ${className ?? ""}`}
      {...rest}
    />
  );
}

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
      className={`flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 ${className ?? ""}`}
    >
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-fg-subtle">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
