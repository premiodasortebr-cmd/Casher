"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarLigador, type EstadoLigador } from "./actions";

const estadoInicial: EstadoLigador = {};

export function NovoLigadorForm() {
  const [estado, formAction, pendente] = useActionState(criarLigador, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) formRef.current?.reset();
  }, [estado.sucesso]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:grid-cols-2"
    >
      <h2 className="col-span-full font-medium text-neutral-100">Novo ligador</h2>

      <input
        name="nome"
        placeholder="Nome"
        required
        className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
      />
      <input
        name="username"
        placeholder="usuário (login)"
        required
        className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
      />
      <input
        name="senha"
        type="password"
        placeholder="senha"
        required
        className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
      />
      <input
        name="foto_url"
        placeholder="URL da foto (opcional)"
        className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
      />

      {estado.erro && <p className="col-span-full text-sm text-red-400">{estado.erro}</p>}
      {estado.sucesso && <p className="col-span-full text-sm text-emerald-400">Ligador criado.</p>}

      <button
        type="submit"
        disabled={pendente}
        className="col-span-full rounded-lg bg-emerald-600 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pendente ? "Criando..." : "Criar ligador"}
      </button>
    </form>
  );
}
