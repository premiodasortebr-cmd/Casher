import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

interface RifaComContagem {
  id: string;
  nome: string;
  premio_valor: number | null;
  data_sorteio: string | null;
  fichas: { count: number }[];
}

export default async function RifasPage() {
  await requireAdminSession();

  const supabase = createAdminClient();
  const { data: rifas } = await supabase
    .from("rifas")
    .select("id, nome, premio_valor, data_sorteio, fichas(count)")
    .order("data_sorteio", { ascending: false })
    .returns<RifaComContagem[]>();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Rifas</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/rifas/importar"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Importar fichas
            </Link>
            <Link href="/admin" className="text-sm text-neutral-400 hover:text-neutral-200">
              ← voltar
            </Link>
          </div>
        </div>

        <ul className="mt-6 divide-y divide-neutral-800 rounded-xl border border-neutral-800">
          {(rifas ?? []).map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/rifas/${r.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-neutral-900"
              >
                <div>
                  <p className="font-medium">{r.nome}</p>
                  <p className="text-sm text-neutral-500">
                    {r.premio_valor != null &&
                      `R$ ${r.premio_valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    {r.data_sorteio &&
                      ` · sorteio em ${new Date(r.data_sorteio).toLocaleString("pt-BR")}`}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                  {r.fichas?.[0]?.count ?? 0} ficha(s)
                </span>
              </Link>
            </li>
          ))}
          {(rifas ?? []).length === 0 && (
            <li className="p-4 text-sm text-neutral-500">
              Nenhuma rifa cadastrada. Importe um arquivo pra começar.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}
