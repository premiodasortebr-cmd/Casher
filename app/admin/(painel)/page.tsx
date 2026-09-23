import {
  ArrowRightIcon,
  HeadsetIcon,
  TicketIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/Layout";
import { Stat } from "@/components/ui/Stats";
import { Card, CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminHomePage() {
  await requireAdminSession();

  const supabase = createAdminClient();
  const [{ count: totalRifas }, { count: totalLigadores }, { count: ligadoresAtivos }, { count: fichasPendentes }] =
    await Promise.all([
      supabase.from("rifas").select("*", { count: "exact", head: true }),
      supabase.from("ligadores").select("*", { count: "exact", head: true }),
      supabase.from("ligadores").select("*", { count: "exact", head: true }).eq("ativo", true),
      supabase.from("fichas").select("*", { count: "exact", head: true }).eq("status", "pendente"),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Visão geral"
        title="Painel Admin"
        description="Acompanhe rifas, ligadores e o progresso das notificações."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Rifas cadastradas" value={totalRifas ?? 0} icon={<TicketIcon />} />
        <Stat label="Fichas pendentes" value={fichasPendentes ?? 0} icon={<HeadsetIcon />} tom="warning" />
        <Stat label="Ligadores ativos" value={ligadoresAtivos ?? 0} icon={<HeadsetIcon />} tom="accent" />
        <Stat label="Total de ligadores" value={totalLigadores ?? 0} icon={<HeadsetIcon />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader
            title="Rifas"
            description="Cadastre rifas e importe fichas de contato"
          />
          <div className="flex flex-col gap-2 p-5">
            <ButtonLink href="/admin/rifas" variant="secondary" block trailingIcon={<ArrowRightIcon size={16} weight="bold" />}>
              Ver rifas
            </ButtonLink>
            <ButtonLink href="/admin/rifas/importar" block icon={<UploadSimpleIcon weight="bold" />}>
              Importar fichas
            </ButtonLink>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Ligadores"
            description="Crie usuários e controle o acesso da equipe"
          />
          <div className="flex flex-col gap-2 p-5">
            <ButtonLink
              href="/admin/ligadores"
              variant="secondary"
              block
              icon={<HeadsetIcon weight="bold" />}
              trailingIcon={<ArrowRightIcon size={16} weight="bold" />}
            >
              Gerenciar ligadores
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  );
}
