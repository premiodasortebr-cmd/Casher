"use client";

import { useState, useTransition } from "react";
import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { excluirTodasFichas } from "./actions";

export function ExcluirFichas() {
  const [etapa, setEtapa] = useState<"idle" | "confirmar" | "feito">("idle");
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [excluidas, setExcluidas] = useState(0);

  function confirmar() {
    startTransition(async () => {
      const r = await excluirTodasFichas();
      if (r.erro) {
        setErro(r.erro);
        setEtapa("idle");
      } else {
        setExcluidas(r.excluidas ?? 0);
        setEtapa("feito");
      }
    });
  }

  if (etapa === "feito") {
    return (
      <p className="text-[13px] text-accent">
        {excluidas} fichas excluídas.
      </p>
    );
  }

  if (etapa === "confirmar") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-danger-soft p-3">
          <WarningCircleIcon size={18} weight="fill" className="shrink-0 text-danger" />
          <p className="text-[13px] text-danger">
            Isso vai apagar TODAS as fichas de todas as rifas. Não tem volta.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="danger" disabled={pendente} onClick={confirmar} icon={<TrashIcon weight="bold" />}>
            {pendente ? "Excluindo…" : "Sim, apagar tudo"}
          </Button>
          <Button size="sm" variant="ghost" disabled={pendente} onClick={() => setEtapa("idle")}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant="danger"
        onClick={() => { setEtapa("confirmar"); setErro(null); }}
        icon={<TrashIcon weight="bold" />}
      >
        Excluir todas as fichas
      </Button>
      {erro && <p className="text-[12px] text-danger">{erro}</p>}
    </div>
  );
}
