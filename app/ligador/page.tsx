import { requireLigadorSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { sairLigador } from "@/lib/auth/actions";
import { FichaCard } from "./FichaCard";
import type { FichaStatus } from "@/lib/types";

interface FichaComRifa {
  id: string;
  cpf: string;
  nome: string;
  telefone: string | null;
  status: FichaStatus;
  observacao: string | null;
  rifa_id: string;
  rifas: { nome: string } | null;
}

export default async function LigadorHomePage() {
  const sessao = await requireLigadorSession();
  const supabase = createAdminClient();

  const { data: acessos } = await supabase
    .from("ligador_acesso")
    .select("ficha_id")
    .eq("ligador_id", sessao.ligadorId);

  const fichaIds = (acessos ?? []).map((a) => a.ficha_id);

  const { data: fichas } = fichaIds.length
    ? await supabase
        .from("fichas")
        .select("id, cpf, nome, telefone, status, observacao, rifa_id, rifas(nome)")
        .in("id", fichaIds)
        .order("nome")
        .returns<FichaComRifa[]>()
    : { data: [] };

  const porRifa = new Map<string, { nome: string; fichas: FichaComRifa[] }>();
  for (const f of fichas ?? []) {
    const grupo = porRifa.get(f.rifa_id) ?? { nome: f.rifas?.nome ?? "Rifa", fichas: [] };
    grupo.fichas.push(f);
    porRifa.set(f.rifa_id, grupo);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Olá, {sessao.nome}</h1>
          <form action={sairLigador}>
            <button className="text-sm text-neutral-400 hover:text-neutral-200">Sair</button>
          </form>
        </header>

        {porRifa.size === 0 && (
          <p className="mt-8 text-neutral-400">Nenhuma ficha liberada pra você ainda.</p>
        )}

        <div className="mt-8 space-y-8">
          {Array.from(porRifa.entries()).map(([rifaId, grupo]) => (
            <section key={rifaId}>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
                {grupo.nome}
              </h2>
              <ul className="space-y-3">
                {grupo.fichas.map((f) => (
                  <FichaCard key={f.id} ficha={f} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
