"use client";

import { useActionState } from "react";
import { entrarComoAdmin, type EstadoLoginAdmin } from "./actions";

const estadoInicial: EstadoLoginAdmin = {};

export default function AdminLoginPage() {
  const [estado, formAction, pendente] = useActionState(entrarComoAdmin, estadoInicial);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl"
      >
        <h1 className="text-xl font-semibold text-neutral-100">Painel Admin</h1>
        <p className="mt-1 text-sm text-neutral-400">Digite o PIN de 6 dígitos.</p>

        <input
          type="password"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          name="pin"
          autoFocus
          required
          placeholder="••••••"
          className="mt-6 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-center text-2xl tracking-[0.5em] text-neutral-100 outline-none focus:border-emerald-500"
        />

        {estado.erro && <p className="mt-3 text-sm text-red-400">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pendente ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
