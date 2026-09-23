"use client";

import { useState, useTransition } from "react";
import { concederAcesso, revogarAcesso } from "./actions";
import type { FichaStatus } from "@/lib/types";

const STATUS_LABEL: Record<FichaStatus, string> = {
  pendente: "Pendente",
  deu_bom: "Deu bom",
  deu_ruim: "Deu ruim",
};

const STATUS_CLASSE: Record<FichaStatus, string> = {
  pendente: "bg-neutral-800 text-neutral-300",
  deu_bom: "bg-emerald-900/60 text-emerald-300",
  deu_ruim: "bg-red-900/60 text-red-300",
};

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

  return (
    <div>
      {ligadores.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <span className="text-sm text-neutral-400">{selecionadas.size} selecionada(s)</span>
          <select
            value={ligadorEscolhido}
            onChange={(e) => setLigadorEscolhido(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100"
          >
            {ligadores.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
          <button
            onClick={darAcesso}
            disabled={pendente || selecionadas.size === 0}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Dar acesso
          </button>
          <button
            onClick={() => marcarTodas(selecionadas.size !== fichas.length)}
            className="ml-auto text-sm text-neutral-400 hover:text-neutral-200"
          >
            {selecionadas.size === fichas.length ? "Desmarcar todas" : "Marcar todas"}
          </button>
        </div>
      )}

      <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800">
        {fichas.map((f) => (
          <li key={f.id} className="flex items-center gap-3 p-3">
            <input
              type="checkbox"
              checked={selecionadas.has(f.id)}
              onChange={() => alternar(f.id)}
              className="h-4 w-4"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{f.nome}</p>
              <p className="text-xs text-neutral-500">
                {f.cpf} {f.telefone && `· ${f.telefone}`}
              </p>
              {f.acessos.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {f.acessos.map((a) => (
                    <span
                      key={a.ligadorId}
                      className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
                    >
                      {a.nome}
                      <button
                        onClick={() =>
                          startTransition(() => revogarAcesso(rifaId, a.ligadorId, f.id))
                        }
                        className="text-neutral-500 hover:text-red-400"
                        title="Revogar acesso"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSE[f.status]}`}>
              {STATUS_LABEL[f.status]}
            </span>
          </li>
        ))}
        {fichas.length === 0 && (
          <li className="p-4 text-sm text-neutral-500">Nenhuma ficha nessa rifa.</li>
        )}
      </ul>
    </div>
  );
}
