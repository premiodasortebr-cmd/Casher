"use client";

import { useState, useTransition } from "react";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Layout";
import { UsersIcon } from "@phosphor-icons/react/dist/ssr";
import { concederAcesso, revogarAcesso } from "./actions";
import type { FichaStatus } from "@/lib/types";

interface FichaLinha {
  id: string;
  cpf: string;
  nome: string;
  telefone: string | null;
  status: FichaStatus;
  acessos: { ligadorId: string; nome: string }[];
}

export function FichasAcesso({
  rifaId,
  fichas,
  ligadores,
}: {
  rifaId: string;
  fichas: FichaLinha[];
  ligadores: { id: string; nome: string }[];
}) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [ligadorEscolhido, setLigadorEscolhido] = useState(ligadores[0]?.id ?? "");
  const [pendente, startTransition] = useTransition();

  function alternar(id: string) {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function marcarTodas(marcar: boolean) {
    setSelecionadas(marcar ? new Set(fichas.map((f) => f.id)) : new Set());
  }

  function darAcesso() {
    if (!ligadorEscolhido || selecionadas.size === 0) return;
    startTransition(async () => {
      await concederAcesso(rifaId, ligadorEscolhido, Array.from(selecionadas));
      setSelecionadas(new Set());
    });
  }

  if (fichas.length === 0) {
    return (
      <Card>
        <EmptyState icon={<UsersIcon />} title="Nenhuma ficha nessa rifa" />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ligadores.length > 0 && (
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-[13px] text-fg-muted">{selecionadas.size} selecionada(s)</span>
          <Select
            value={ligadorEscolhido}
            onChange={(e) => setLigadorEscolhido(e.target.value)}
            className="h-9 w-auto"
          >
            {ligadores.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={darAcesso} disabled={pendente || selecionadas.size === 0}>
            Dar acesso
          </Button>
          <button
            onClick={() => marcarTodas(selecionadas.size !== fichas.length)}
            className="ml-auto text-[13px] text-fg-subtle hover:text-fg"
          >
            {selecionadas.size === fichas.length ? "Desmarcar todas" : "Marcar todas"}
          </button>
        </Card>
      )}

      <Card className="divide-y divide-line overflow-hidden">
        {fichas.map((f) => (
          <div key={f.id} className="flex items-center gap-3 p-4">
            <input
              type="checkbox"
              checked={selecionadas.has(f.id)}
              onChange={() => alternar(f.id)}
              className="size-4 shrink-0 accent-accent"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-fg">{f.nome}</p>
              <p className="text-[12.5px] text-fg-subtle">
                {f.cpf} {f.telefone && `· ${f.telefone}`}
              </p>
              {f.acessos.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {f.acessos.map((a) => (
                    <span
                      key={a.ligadorId}
                      className="flex items-center gap-1 rounded-full border border-line-strong bg-white/[0.04] py-0.5 pl-2.5 pr-1 text-[12px] text-fg-muted"
                    >
                      {a.nome}
                      <button
                        onClick={() => startTransition(() => revogarAcesso(rifaId, a.ligadorId, f.id))}
                        className="flex size-4 items-center justify-center rounded-full text-fg-subtle hover:bg-danger/15 hover:text-danger"
                        title="Revogar acesso"
                      >
                        <XIcon size={10} weight="bold" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <StatusBadge status={f.status} />
          </div>
        ))}
      </Card>
    </div>
  );
}
