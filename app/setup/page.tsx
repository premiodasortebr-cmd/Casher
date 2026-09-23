import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowRightIcon, CheckCircleIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { AuthShell } from "@/components/auth/AuthShell";
import { ButtonLink } from "@/components/ui/Button";
import { getSessaoAdmin } from "@/lib/auth/session";
import { envConfigurado, podeEscreverEnvLocal } from "@/lib/env/status";
import { SetupForm } from "./SetupForm";
import { GeradorHospedagem } from "./GeradorHospedagem";

export const metadata: Metadata = { title: "Configuração" };

const VARIAVEIS = [
  ["SUPABASE_URL", "Project Settings → API → Project URL"],
  ["SUPABASE_SERVICE_ROLE_KEY", "Project Settings → API → service_role"],
  ["DATABASE_URL", "Database → Connection string → Session pooler"],
  ["ADMIN_PIN_HASH", "gerado aqui embaixo a partir do seu PIN"],
  ["SESSION_SECRET", "o render.yaml gera sozinho"],
] as const;

export default async function SetupPage() {
  await connection();
  const configurado = envConfigurado();
  const local = podeEscreverEnvLocal();
  // Em produção, depois de configurado, esta tela não tem função — e não pode
  // ficar apontando o caminho do /admin pra qualquer visitante.
  if (configurado && !local) redirect("/ligador");
  const admin = configurado ? await getSessaoAdmin() : null;

  const headline = (
    <>
      Conecte o banco.
      <br />
      <span className="text-fg-subtle">O resto é automático.</span>
    </>
  );
  const headlineDescription =
    "As tabelas são criadas e atualizadas sozinhas a cada deploy. Você só cola as chaves do Supabase uma vez.";

  if (local && (!configurado || admin)) {
    return (
      <AuthShell
        eyebrow={configurado ? "Configuração" : "Primeiro acesso"}
        title={configurado ? "Alterar configuração" : "Configurar o Casher"}
        description="Fica salvo em .env.local, só nesta máquina — nunca vai pro Git."
        headline={headline}
        headlineDescription={headlineDescription}
      >
        <SetupForm modo={configurado ? "editar" : "novo"} temBanco={Boolean(process.env.DATABASE_URL)} />
      </AuthShell>
    );
  }

  if (!local && !configurado) {
    return (
      <AuthShell
        eyebrow="Hospedagem"
        title="Falta configurar o servidor"
        description="Em produção nada é gravado pelo site: as chaves vão nas variáveis de ambiente do Render."
        headline={headline}
        headlineDescription={headlineDescription}
      >
        <ul className="mb-6 flex flex-col divide-y divide-line rounded-xl border border-line">
          {VARIAVEIS.map(([nome, origem]) => (
            <li key={nome} className="flex flex-col gap-0.5 px-3.5 py-2.5">
              <code className="text-[12px] font-medium text-fg">{nome}</code>
              <span className="text-[12px] text-fg-subtle">{origem}</span>
            </li>
          ))}
        </ul>
        <GeradorHospedagem />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Configuração"
      title="Tudo configurado"
      description="Pra alterar as chaves ou o PIN, entre como admin primeiro."
      headline={headline}
      headlineDescription={headlineDescription}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-[13.5px] text-accent">
          <CheckCircleIcon size={20} weight="fill" />
          Banco e acesso configurados.
        </div>
        <ButtonLink
          href="/admin/login"
          size="lg"
          block
          icon={<LockKeyIcon weight="fill" />}
          trailingIcon={<ArrowRightIcon size={16} weight="bold" />}
        >
          Entrar no painel
        </ButtonLink>
      </div>
    </AuthShell>
  );
}
