"use client";

import { useState, useTransition } from "react";
import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { excluirLigador } from "./actions";

export function ExcluirLigador({ ligadorId, nome }: { ligadorId: string; nome: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function confirmar() {
    startTransition(async () => {
      const r = await excluirLigador(ligadorId);
      if (r.erro) {
        setErro(r.erro);
        setConfirmando(false);
      }
    });
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="danger" disabled={pendente} onClick={confirmar}>
          {pendente ? "Excluindo…" : "Confirmar"}
        </Button>
        <Button size="sm" variant="ghost" disabled={pendente} onClick={() => setConfirmando(false)}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => { setConfirmando(true); setErro(null); }}
        className="flex size-7 items-center justify-center rounded-lg text-fg-subtle transition-colors duration-300 ease-spring hover:bg-danger-soft hover:text-danger"
        title={`Excluir ${nome}`}
        aria-label={`Excluir ${nome}`}
      >
        <TrashIcon size={15} />
      </button>
      {erro && (
        <p className="text-[11px] text-danger">{erro}</p>
      )}
    </div>
  );
}
