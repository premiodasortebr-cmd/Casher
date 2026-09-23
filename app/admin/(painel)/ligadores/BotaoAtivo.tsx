"use client";

import { useTransition } from "react";
import { alternarAtivoLigador } from "./actions";

export function BotaoAtivo({ ligadorId, ativo }: { ligadorId: string; ativo: boolean }) {
  const [pendente, startTransition] = useTransition();

  return (
    <button
      disabled={pendente}
      onClick={() => startTransition(() => alternarAtivoLigador(ligadorId, !ativo))}
      className={`rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
        ativo
          ? "bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900"
          : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
      }`}
    >
      {ativo ? "Ativo" : "Inativo"}
    </button>
  );
}
