"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircleIcon, UserPlusIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Layout";
import { criarLigador, type EstadoLigador } from "./actions";

const estadoInicial: EstadoLigador = {};

export function NovoLigadorForm() {
  const [estado, formAction, pendente] = useActionState(criarLigador, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) formRef.current?.reset();
  }, [estado.sucesso]);

  return (
    <Card>
      <CardHeader title="Novo ligador" description="Cadastre um novo operador com login próprio" />
      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <Field label="Nome" htmlFor="nome">
          <Input id="nome" name="nome" placeholder="Nome completo" required />
        </Field>
        <Field label="Usuário" htmlFor="username">
          <Input id="username" name="username" placeholder="login" required autoComplete="off" />
        </Field>
        <Field label="Senha" htmlFor="senha">
          <Input id="senha" name="senha" type="password" placeholder="••••••" required autoComplete="new-password" />
        </Field>
        <Field label="Foto (opcional)" htmlFor="foto_url">
          <Input id="foto_url" name="foto_url" placeholder="URL da foto" autoComplete="off" />
        </Field>

        {estado.erro && (
          <Alert icon={<WarningCircleIcon weight="fill" />} className="sm:col-span-2">
            {estado.erro}
          </Alert>
        )}
        {estado.sucesso && (
          <Alert tom="accent" icon={<CheckCircleIcon weight="fill" />} className="sm:col-span-2">
            Ligador criado com sucesso.
          </Alert>
        )}

        <Button
          type="submit"
          disabled={pendente}
          icon={<UserPlusIcon weight="bold" />}
          className="sm:col-span-2"
        >
          {pendente ? "Criando…" : "Criar ligador"}
        </Button>
      </form>
    </Card>
  );
}
