import Link from "next/link";
import { connection } from "next/server";
import { ArrowRightIcon, CheckCircleIcon, CoinsIcon } from "@phosphor-icons/react/dist/ssr";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { envConfigurado } from "@/lib/env/status";

export default async function Home() {
  await connection();
  const configurado = envConfigurado();

  const features = [
    { icon: "✓", title: "Gerenciamento de Sorteios", desc: "Crie e organize rifas com facilidade" },
    { icon: "✓", title: "Painel Admin", desc: "Controle total sobre ligadores e notificações" },
    { icon: "✓", title: "Aplicação Operador", desc: "Interface para contactar ganhadores via WhatsApp" },
    { icon: "✓", title: "Autenticação Segura", desc: "PIN admin + usuário/senha com rate limiting" },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-accent/[0.08] blur-[100px]" />
        <div className="absolute -right-40 bottom-32 size-[500px] rounded-full bg-accent/[0.05] blur-[120px]" />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="border-b border-line px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <Logo />
            {configurado && (
              <div className="flex gap-2">
                <ButtonLink href="/admin/login" variant="secondary" size="sm">
                  Admin
                </ButtonLink>
                <ButtonLink href="/ligador/login" variant="secondary" size="sm">
                  Ligador
                </ButtonLink>
              </div>
            )}
          </div>
        </header>

        {/* Hero */}
        <section className="px-4 py-24 sm:px-8 sm:py-32 md:py-40">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
              <CoinsIcon size={16} className="text-accent" weight="fill" />
              <span className="text-xs font-medium text-accent">Sistema de Sorteios Profissional</span>
            </div>
            <h1 className="text-5xl font-semibold leading-tight tracking-[-0.03em] text-fg md:text-6xl">
              Gerenciar sorteios nunca foi tão fácil
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-fg-muted md:text-xl">
              Casher é uma plataforma completa para administrar rifas, gerenciar ligadores e notificar ganhadores com segurança e eficiência.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              {!configurado ? (
                <ButtonLink
                  href="/setup"
                  size="lg"
                  trailingIcon={<ArrowRightIcon size={16} weight="bold" />}
                >
                  Começar Configuração
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink
                    href="/admin/login"
                    size="lg"
                    icon={<CheckCircleIcon size={18} weight="fill" />}
                    trailingIcon={<ArrowRightIcon size={16} weight="bold" />}
                  >
                    Acessar Admin
                  </ButtonLink>
                  <ButtonLink
                    href="/ligador/login"
                    size="lg"
                    variant="secondary"
                    trailingIcon={<ArrowRightIcon size={16} weight="bold" />}
                  >
                    Área Ligador
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-line px-4 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold text-fg md:text-4xl">Tudo que você precisa</h2>
              <p className="mt-3 text-fg-muted">Uma plataforma integrada para gerenciar sua operação</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex gap-4 rounded-2xl border border-line-strong bg-surface-2/50 p-6 backdrop-blur-sm transition hover:border-accent/30 hover:bg-surface-2"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <CheckCircleIcon size={20} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-fg">{f.title}</h3>
                    <p className="mt-1 text-sm text-fg-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-line px-4 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-fg">Pronto para começar?</h2>
            <p className="mt-3 text-fg-muted">Configure o Casher em 5 minutos e comece a gerenciar sorteios profissionalmente</p>
            {!configurado && (
              <div className="mt-8">
                <ButtonLink
                  href="/setup"
                  size="lg"
                  trailingIcon={<ArrowRightIcon size={16} weight="bold" />}
                >
                  Acessar Configuração
                </ButtonLink>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-line px-4 py-8 text-center text-xs text-fg-subtle sm:px-8">
          <p>© 2026 Casher. Sistema de gerenciamento de sorteios.</p>
        </footer>
      </div>
    </main>
  );
}
