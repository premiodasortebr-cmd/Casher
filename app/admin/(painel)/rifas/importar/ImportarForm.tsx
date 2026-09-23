"use client";

import { useActionState } from "react";
import { importarFichas, type EstadoImport } from "./actions";

const estadoInicial: EstadoImport = {};

export function ImportarForm() {
  const [estado, formAction, pendente] = useActionState(importarFichas, estadoInicial);

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
      >
        <label className="block text-sm text-neutral-300">
          Arquivo .txt exportado do checker
          <input
            type="file"
            name="arquivo"
            accept=".txt"
            required
            className="mt-2 block w-full text-sm text-neutral-300 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white hover:file:bg-emerald-500"
          />
        </label>

        {estado.erro && <p className="mt-3 text-sm text-red-400">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pendente ? "Importando..." : "Importar"}
        </button>
      </form>

      {estado.resumo && (
        <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-5">
          <p className="font-medium text-emerald-300">
            Importado: {estado.resumo.totalRifas} rifa(s), {estado.resumo.totalFichas} ficha(s).
          </p>
          <ul className="mt-3 space-y-1 text-sm text-neutral-300">
            {estado.resumo.detalhes.map((d) => (
              <li key={d.nome}>
                {d.nome} — {d.fichas} ficha(s)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
