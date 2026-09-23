import Link from "next/link";
import { connection } from "next/server";
import { envConfigurado } from "@/lib/env/status";

export default async function Home() {
  // Força renderização dinâmica: sem isso o Next prerenderia essa página como
  // estática (no build) e nunca mais checaria as env vars de novo em produção.
  await connection();
  const configurado = envConfigurado();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-4">
      <h1 className="text-2xl font-semibold text-neutral-100">Casher</h1>

      {!configurado ? (
        <Link
          href="/setup"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-500"
        >
          Configurar Supabase
        </Link>
      ) : (
        <div className="flex gap-4">
          <Link
            href="/admin/login"
            className="rounded-lg border border-neutral-700 px-5 py-2.5 text-neutral-200 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            Painel Admin
          </Link>
          <Link
            href="/ligador/login"
            className="rounded-lg border border-neutral-700 px-5 py-2.5 text-neutral-200 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            Área do Ligador
          </Link>
        </div>
      )}
    </main>
  );
}
