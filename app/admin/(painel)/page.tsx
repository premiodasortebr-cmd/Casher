import Link from "next/link";
import { sairAdmin } from "@/lib/auth/actions";

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Painel Admin — Casher</h1>
          <form action={sairAdmin}>
            <button className="text-sm text-neutral-400 hover:text-neutral-200">Sair</button>
          </form>
        </header>

        <nav className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/admin/rifas"
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-emerald-600"
          >
            <p className="font-medium">Rifas</p>
            <p className="mt-1 text-sm text-neutral-400">Cadastrar e importar fichas</p>
          </Link>
          <Link
            href="/admin/ligadores"
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-emerald-600"
          >
            <p className="font-medium">Ligadores</p>
            <p className="mt-1 text-sm text-neutral-400">Criar usuários e dar acesso</p>
          </Link>
        </nav>
      </div>
    </main>
  );
}
