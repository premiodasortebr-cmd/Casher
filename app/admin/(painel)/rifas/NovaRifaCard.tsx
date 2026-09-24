"use client";

import { useActionState, useState } from "react";
import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { criarRifa, type EstadoRifa } from "./actions";

/** Card tracejado no fim da grade: vira um campo de nome ao clicar. */
export function NovaRifaCard({ inicialAberto = false }: { inicialAberto?: boolean }) {
  const [aberto, setAberto] = useState(inicialAberto);
  const [nome, setNome] = useState("");
  const [estado, formAction, pendente] = useActionState<EstadoRifa, FormData>(async (anterior, dados) => {
    const r = await criarRifa(anterior, dados);
    if (r.sucesso) {
      setNome("");
      setAberto(false);
    }
    return r;
  }, {});

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="group flex min-h-[184px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-white/[0.01] p-5 text-center transition-[background-color,border-color] duration-300 ease-spring hover:border-accent/40 hover:bg-accent-soft"
      >
        <span className="flex size-11 items-center justify-center rounded-2xl border border-line-strong bg-surface-2 text-fg-muted transition-[color,transform] duration-500 ease-spring group-hover:scale-105 group-hover:text-accent">
          <PlusIcon size={20} weight="bold" />
        </span>
        <span>
          <span className="block text-[14px] font-medium text-fg">Nova rifa</span>
          <span className="mt-0.5 block text-[12.5px] text-fg-subtle">Ex.: Bolada Pix, Mega Moto…</span>
        </span>
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex min-h-[184px] animate-fade-in flex-col justify-between gap-4 rounded-2xl border border-accent-line bg-surface p-5 shadow-bezel"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="nova-rifa" className="text-[13px] font-medium text-fg-muted">
          Nome da rifa
        </label>
        <Input
          id="nova-rifa"
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Bolada Pix"
          maxLength={60}
          autoFocus
          autoComplete="off"
          aria-invalid={Boolean(estado.erro) || undefined}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAberto(false);
          }}
        />
        {estado.erro && (
          <p className="flex items-center gap-1.5 text-[12.5px] text-danger">
            <WarningCircleIcon weight="fill" />
            {estado.erro}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setAberto(false)} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pendente || nome.trim().length < 2} className="flex-1">
          {pendente ? "Criando…" : "Criar rifa"}
        </Button>
      </div>
    </form>
  );
}
