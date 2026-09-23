import { iniciais } from "@/lib/format";

const tamanhos = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-[13px]",
  lg: "size-12 text-base",
} as const;

export function Avatar({
  nome,
  fotoUrl,
  size = "md",
  className,
}: {
  nome: string;
  fotoUrl?: string | null;
  size?: keyof typeof tamanhos;
  className?: string;
}) {
  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL arbitrária colada pelo admin; next/image exigiria allowlist de domínios.
      <img
        src={fotoUrl}
        alt=""
        className={`${tamanhos[size]} shrink-0 rounded-full object-cover ring-1 ring-white/10 ${className ?? ""}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${tamanhos[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-b from-surface-3 to-surface-2 font-medium tracking-tight text-fg-muted ring-1 ring-white/10 ${className ?? ""}`}
    >
      {iniciais(nome)}
    </span>
  );
}
