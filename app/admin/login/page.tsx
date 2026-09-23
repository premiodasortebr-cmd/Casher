"use client";

import { useActionState } from "react";
import { LockKeyIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { PinInput } from "@/components/ui/PinInput";
import { Alert } from "@/components/ui/Layout";
import { entrarComoAdmin, type EstadoLoginAdmin } from "./actions";

const estadoInicial: EstadoLoginAdmin = {};

export default function AdminLoginPage() {
  const [estado, formAction, pendente] = useActionState(entrarComoAdmin, estadoInicial);

  return (
    <AuthShell
      eyebrow="Painel Admin"
      title="Entrar como admin"
      description="Digite o PIN de 6 dígitos configurado no /setup."
      headline={
        <>
          Controle total.
          <br />
          <span className="text-fg-subtle">Segurança em cada acesso.</span>
        </>
      }
      headlineDescription="Gerencie sorteios, ligadores e acompanhe cada notificação enviada aos ganhadores."
    >
      <form action={formAction} className="flex flex-col gap-5" key={estado.tentativa ?? 0}>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-fg-muted">PIN de acesso</span>
          <PinInput name="pin" autoFocus invalid={Boolean(estado.erro)} />
        </div>

        {estado.erro && <Alert icon={<WarningCircleIcon weight="fill" />}>{estado.erro}</Alert>}

        <Button
          type="submit"
          size="lg"
          block
          disabled={pendente}
          icon={<LockKeyIcon weight="fill" />}
        >
          {pendente ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
