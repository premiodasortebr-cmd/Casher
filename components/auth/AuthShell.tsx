import type { ReactNode } from "react";
import { BezelCard } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";

/**
 * Tela de entrada: painel da marca à esquerda (só desktop) + cartão do formulário.
 * O fundo (orbe lima + grade com máscara) é fixo pra não repintar no scroll.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  headline,
  headlineDescription,
  footer,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Frase grande do painel da marca (desktop). */
  headline: ReactNode;
  headlineDescription?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-[-20%] size-[720px] rounded-full bg-accent/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[-10%] size-[560px] rounded-full bg-accent/[0.04] blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_30%_40%,black,transparent)]" />
      </div>

      <div className="relative mx-auto grid min-h-[100dvh] max-w-[1200px] grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        <section className="hidden flex-col justify-between px-10 py-12 lg:flex">
          <Logo className="w-max" />
          <div className="max-w-[30rem] animate-fade-up">
            <h2 className="text-[52px] font-semibold leading-[1.02] tracking-[-0.045em] text-fg">
              {headline}
            </h2>
            {headlineDescription && (
              <p className="mt-5 max-w-[26rem] text-[15.5px] leading-relaxed text-fg-muted">
                {headlineDescription}
              </p>
            )}
          </div>
          <p className="text-[12px] text-fg-subtle">
            Acesso restrito à equipe. Tudo que é marcado aqui fica registrado.
          </p>
        </section>

        <section className="flex flex-col px-4 py-8 sm:px-8 lg:justify-center lg:py-12">
          <Logo className="mb-10 w-max lg:hidden" />
          <div className="mx-auto w-full max-w-[420px] animate-fade-up [animation-delay:80ms]">
            <BezelCard innerClassName="px-6 py-8 sm:px-8 sm:py-9">
              {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
              <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-fg">
                {title}
              </h1>
              {description && (
                <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted">{description}</p>
              )}
              <div className="mt-7">{children}</div>
            </BezelCard>
            {footer && <div className="mt-6 text-center text-[13px] text-fg-subtle">{footer}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
