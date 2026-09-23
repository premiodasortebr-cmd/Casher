import { CoinsIcon } from "@phosphor-icons/react/dist/ssr";

/** Marca: quadrado lima com moedas + wordmark em Geist apertado. */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="relative flex size-8 items-center justify-center rounded-[10px] bg-accent text-accent-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.45),0_6px_20px_-6px_rgb(200_238_114/0.55)]">
        <CoinsIcon size={18} weight="bold" />
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-0.04em] text-fg">casher</span>
      )}
    </span>
  );
}
