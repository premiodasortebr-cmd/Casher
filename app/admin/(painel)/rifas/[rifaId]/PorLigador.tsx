"use client";

import { useTransition } from "react";
import { ArrowCounterClockwiseIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StatusBar } from "@/components/ui/Stats";
import { EmptyState } from "@/components/ui/Layout";
import { formatNumero } from "@/lib/format";
import type { RifaLigadorResumo } from "@/lib/types";
import { recolherPendentes } from "./actions";

function BotaoRecolher({ rifaId, ligador }: { rifaId: string; ligador: RifaLigadorResumo }) {
  const [pendente, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pendente}
      icon={<ArrowCounterClockwiseIcon />}
      onClick={() => {
        if (!confirm(`Recolher ${ligador.pendentes} pendente(s) de ${ligador.nome}? Elas voltam pra fila de disponíveis.`)) return;
        startTransition(async () => {
          await recolherPendentes(rifaId, ligador.ligador_id);
        });
      }}
    >
      {pendente ? "Recolhendo…" : "Recolher"}
    </Button>
  );
}

export function PorLigador({ rifaId, linhas }: { rifaId: string; linhas: RifaLigadorResumo[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader title="Por ligador" description="Quem está com o quê nessa rifa" />
      {linhas.length === 0 ? (
        <EmptyState
          icon={<UsersThreeIcon />}
          title="Nada distribuído ainda"
          description="Use o painel ao lado pra enviar fichas."
          className="py-10"
        />
      ) : (
        <ul className="divide-y divide-line">
          {linhas.map((l) => (
            <li key={l.ligador_id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar nome={l.nome} fotoUrl={l.foto_url} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[13.5px] font-medium text-fg">
                    {l.nome}
                    {!l.ativo && <span className="ml-1.5 text-[11px] font-normal text-fg-subtle">inativo</span>}
                  </p>
                  <span className="shrink-0 font-mono text-[12.5px] tabular-nums text-fg-muted">
                    {formatNumero(l.atribuidas)}
                  </span>
                </div>
                <StatusBar
                  contagem={{ deu_bom: l.deu_bom, deu_ruim: l.deu_ruim, pendente: l.pendentes }}
                  className="mt-1.5"
                  altura="h-1.5"
                />
                <p className="mt-1 text-[11.5px] text-fg-subtle">
                  <span className="text-warning">{l.pendentes} pend.</span> · <span className="text-accent">{l.deu_bom} bom</span> ·{" "}
                  <span className="text-danger">{l.deu_ruim} ruim</span>
                </p>
              </div>
              {l.pendentes > 0 && <BotaoRecolher rifaId={rifaId} ligador={l} />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
