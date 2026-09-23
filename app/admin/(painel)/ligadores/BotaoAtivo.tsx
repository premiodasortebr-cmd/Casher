"use client";

import { useTransition } from "react";
import { alternarAtivoLigador } from "./actions";

export function BotaoAtivo({ ligadorId, ativo }: { ligadorId: string; ativo: boolean }) {
  const [pendente, startTransition] = useTransition();

  return (
    <button
      disabled={pendente}
      onClick={() => startTransition(() => alternarAtivoLigador(ligadorId, !ativo))}
      className={`inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-[background-color,border-color,color] duration-300 ease-spring disabled:opacity-50 ${
        ativo
          ? "border-accent-line bg-accent-soft text-accent hover:bg-accent/15"
          : "border-line-strong bg-white/[0.04] text-fg-subtle hover:bg-white/[0.07]"
      }`}
    >
      {ativo ? "Ativo" : "Inativo"}
    </button>
  );
}
