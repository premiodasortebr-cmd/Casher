"use client";

import { useActionState } from "react";
import { entrarComoLigador, type EstadoLoginLigador } from "./actions";

const estadoInicial: EstadoLoginLigador = {};

export default function LigadorLoginPage() {
  const [estado, formAction, pendente] = useActionState(entrarComoLigador, estadoInicial);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl"
      >
        <h1 className="text-xl font-semibold text-neutral-100">Casher</h1>
        <p className="mt-1 text-sm text-neutral-400">Entre com seu usuário e senha.</p>

        <label className="mt-6 block text-sm text-neutral-300">
          Usuário
          <input
            type="text"
            name="username"
            autoFocus
            required
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-neutral-100 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-300">
          Senha
          <input
            type="password"
            name="senha"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-neutral-100 outline-none focus:border-emerald-500"
          />
        </label>

        {estado.erro && <p className="mt-3 text-sm text-red-400">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pendente ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
