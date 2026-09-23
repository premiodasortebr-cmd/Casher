"use client";

import { useActionState } from "react";
import { SignInIcon, UserIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Layout";
import { entrarComoLigador, type EstadoLoginLigador } from "./actions";

const estadoInicial: EstadoLoginLigador = {};

export default function LigadorLoginPage() {
  const [estado, formAction, pendente] = useActionState(entrarComoLigador, estadoInicial);

  return (
    <AuthShell
      eyebrow="Área do Ligador"
      title="Entrar"
      description="Use o usuário e senha cadastrados pelo admin."
      headline={
        <>
          Notifique ganhadores.
          <br />
          <span className="text-fg-subtle">Com rapidez e organização.</span>
        </>
      }
      headlineDescription="Acesse suas fichas de contato e registre cada retorno diretamente pelo Casher."
    >
      <form action={formAction} className="flex flex-col gap-5">
        <Field label="Usuário" htmlFor="username">
          <Input
            id="username"
            name="username"
            autoFocus
            required
            autoComplete="username"
            defaultValue={estado.username}
            icon={<UserIcon />}
          />
        </Field>

        <Field label="Senha" htmlFor="senha">
          <Input id="senha" name="senha" type="password" required autoComplete="current-password" />
        </Field>

        {estado.erro && <Alert icon={<WarningCircleIcon weight="fill" />}>{estado.erro}</Alert>}

        <Button
          type="submit"
          size="lg"
          block
          disabled={pendente}
          icon={<SignInIcon weight="bold" />}
        >
          {pendente ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
