import { CoinsIcon } from "@phosphor-icons/react/dist/ssr";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="relative flex size-8 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.35),0_0_20px_-4px_rgb(34_197_94/0.5)]">
        <CoinsIcon size={18} weight="bold" />
      </span>
      {!compact && (
        <span className="text-[17px] font-bold tracking-[-0.04em] text-fg">casher</span>
      )}
    </span>
  );
}
