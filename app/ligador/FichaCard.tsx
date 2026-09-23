"use client";

import { useState, useTransition } from "react";
import { marcarStatus } from "./actions";
import type { FichaStatus } from "@/lib/types";

const STATUS_CLASSE: Record<FichaStatus, string> = {
  pendente: "bg-neutral-800 text-neutral-300",
  deu_bom: "bg-emerald-900/60 text-emerald-300",
  deu_ruim: "bg-red-900/60 text-red-300",
};

interface Props {
  id: string;
  cpf: string;
  nome: string;
  telefone: string | null;
  status: FichaStatus;
  observacao: string | null;
}

export function FichaCard({ ficha }: { ficha: Props }) {
  const [observacao, setObservacao] = useState(ficha.observacao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function marcar(status: FichaStatus) {
    startTransition(async () => {
      const resultado = await marcarStatus(ficha.id, status, observacao || undefined);
      setErro(resultado.erro ?? null);
    });
  }

  return (
    <li className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{ficha.nome}</p>
          <p className="text-sm text-neutral-500">
            {ficha.cpf} {ficha.telefone && `· ${ficha.telefone}`}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSE[ficha.status]}`}>
          {ficha.status === "pendente" ? "Pendente" : ficha.status === "deu_bom" ? "Deu bom" : "Deu ruim"}
        </span>
      </div>

      <input
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Observação (opcional)"
        className="mt-3 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-emerald-500"
      />

      {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}

      <div className="mt-3 flex gap-2">
        <button
          disabled={pendente}
          onClick={() => marcar("deu_bom")}
          className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Deu bom
        </button>
        <button
          disabled={pendente}
          onClick={() => marcar("deu_ruim")}
          className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          Deu ruim
        </button>
        <button
          disabled={pendente}
          onClick={() => marcar("pendente")}
          className="flex-1 rounded-lg bg-neutral-700 py-2 text-sm font-medium text-white hover:bg-neutral-600 disabled:opacity-50"
        >
          Pendente
        </button>
      </div>
    </li>
  );
}
