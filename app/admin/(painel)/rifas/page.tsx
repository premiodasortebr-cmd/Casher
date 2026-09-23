import Link from "next/link";
import { CalendarIcon, TicketIcon, UploadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader, EmptyState } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL, formatDataHora } from "@/lib/format";

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

  const lista = rifas ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Rifas"
        title="Todas as rifas"
        description="Gerencie os sorteios cadastrados e importe novas fichas de contato."
        actions={
          <ButtonLink href="/admin/rifas/importar" icon={<UploadSimpleIcon weight="bold" />}>
            Importar fichas
          </ButtonLink>
        }
      />

      {lista.length === 0 ? (
        <Card>
          <EmptyState
            icon={<TicketIcon />}
            title="Nenhuma rifa cadastrada"
            description="Importe um arquivo de fichas pra começar a organizar seus sorteios."
            action={
              <ButtonLink href="/admin/rifas/importar" icon={<UploadSimpleIcon weight="bold" />}>
                Importar fichas
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {lista.map((r) => (
            <Link
              key={r.id}
              href={`/admin/rifas/${r.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-300 ease-spring hover:bg-white/[0.03]"
            >
              <div className="min-w-0">
                <p className="font-medium text-fg">{r.nome}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-subtle">
                  {r.premio_valor != null && <span>{formatBRL(r.premio_valor)}</span>}
                  {r.data_sorteio && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon size={13} />
                      {formatDataHora(r.data_sorteio)}
                    </span>
                  )}
                </div>
              </div>
              <Badge icon={<TicketIcon weight="fill" />}>{r.fichas?.[0]?.count ?? 0} ficha(s)</Badge>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
