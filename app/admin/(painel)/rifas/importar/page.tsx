import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/guard";
import { ImportarForm } from "./ImportarForm";

export default async function ImportarRifasPage() {
  await requireAdminSession();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Importar fichas</h1>
          <Link href="/admin/rifas" className="text-sm text-neutral-400 hover:text-neutral-200">
            ← voltar
          </Link>
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          Sobe o .txt do checker (padrão &quot;=== CPF ... ===&quot; com &quot;Compra N&quot; dentro).
          Cada &quot;Edição&quot; vira uma rifa e cada compra vira uma ficha. Reimportar o mesmo
          arquivo atualiza os dados em vez de duplicar.
        </p>

        <div className="mt-6">
          <ImportarForm />
        </div>
      </div>
    </main>
  );
}
