import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Ligador } from "@/lib/types";
import { NovoLigadorForm } from "./NovoLigadorForm";
import { BotaoAtivo } from "./BotaoAtivo";

export default async function LigadoresPage() {
  await requireAdminSession();

  const supabase = createAdminClient();
  const { data: ligadores } = await supabase
    .from("ligadores")
    .select("id, username, nome, foto_url, ativo, created_at")
    .order("created_at", { ascending: false })
    .returns<Ligador[]>();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Ligadores</h1>
          <Link href="/admin" className="text-sm text-neutral-400 hover:text-neutral-200">
            ← voltar
          </Link>
        </div>

        <div className="mt-6">
          <NovoLigadorForm />
        </div>

        <ul className="mt-6 divide-y divide-neutral-800 rounded-xl border border-neutral-800">
          {(ligadores ?? []).map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                {l.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.foto_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-sm text-neutral-400">
                    {l.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium">{l.nome}</p>
                  <p className="text-sm text-neutral-500">@{l.username}</p>
                </div>
              </div>
              <BotaoAtivo ligadorId={l.id} ativo={l.ativo} />
            </li>
          ))}
          {(ligadores ?? []).length === 0 && (
            <li className="p-4 text-sm text-neutral-500">Nenhum ligador cadastrado ainda.</li>
          )}
        </ul>
      </div>
    </main>
  );
}
