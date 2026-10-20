"use client";

import { useState, useTransition } from "react";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr";
import { salvarDadosCliente } from "./actions";

export function DadosCliente({
  fichaId,
  nomeInicial,
  nascimentoInicial,
}: {
  fichaId: string;
  nomeInicial: string;
  nascimentoInicial: string | null;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [nascimento, setNascimento] = useState(nascimentoInicial ?? "");
  const [pendente, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function salvar() {
    start(async () => {
      const r = await salvarDadosCliente(fichaId, {
        nome: nome.trim(),
        nascimento: nascimento || undefined,
      });
      setMsg(r.erro ?? "Salvo!");
      setTimeout(() => setMsg(null), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1.5 block text-[11.5px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
          Nome
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="h-10 w-full rounded-xl border border-line-strong bg-surface-2 px-3 text-sm text-fg outline-none transition-all duration-300 focus:border-accent/60"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[11.5px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
          Nascimento
        </label>
        <input
          type="date"
          value={nascimento}
          onChange={(e) => setNascimento(e.target.value)}
          className="h-10 w-full rounded-xl border border-line-strong bg-surface-2 px-3 text-sm text-fg outline-none transition-all duration-300 focus:border-accent/60"
        />
      </div>
      <button
        type="button"
        onClick={salvar}
        disabled={pendente}
        className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface-2 text-[13px] font-medium text-fg transition-all duration-300 hover:bg-surface-3 active:scale-[0.97] disabled:opacity-50"
      >
        <FloppyDiskIcon size={15} weight="fill" />
        {pendente ? "Salvando..." : "Salvar dados"}
      </button>
      {msg && (
        <p className={`text-center text-[12.5px] ${msg === "Salvo!" ? "text-accent" : "text-danger"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
