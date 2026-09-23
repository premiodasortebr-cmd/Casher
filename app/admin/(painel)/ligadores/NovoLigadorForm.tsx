"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircleIcon, PlusIcon, UserPlusIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Layout";
import { criarLigador, type EstadoLigador } from "./actions";

const estadoInicial: EstadoLigador = {};

export function NovoLigadorForm({ inicialAberto = false }: { inicialAberto?: boolean }) {
  const [aberto, setAberto] = useState(inicialAberto);
  const [estado, formAction, pendente] = useActionState(criarLigador, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) formRef.current?.reset();
  }, [estado.sucesso]);

  return (
    <Card>
      <CardHeader
        title="Novo ligador"
        description="Cada ligador entra com usuário e senha próprios"
        className={aberto ? "" : "border-b-0"}
        actions={
          <Button
            size="sm"
            variant={aberto ? "ghost" : "secondary"}
            icon={aberto ? <XIcon weight="bold" /> : <PlusIcon weight="bold" />}
            onClick={() => setAberto((a) => !a)}
          >
            {aberto ? "Fechar" : "Adicionar"}
          </Button>
        }
      />
      {aberto && (
        <form ref={formRef} action={formAction} className="grid animate-fade-in grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="Nome" htmlFor="nome">
            <Input id="nome" name="nome" placeholder="Nome completo" required autoFocus />
          </Field>
          <Field label="Usuário" htmlFor="username" hint="Só letras minúsculas, números, ponto, hífen ou underline.">
            <Input id="username" name="username" placeholder="login" required autoComplete="off" spellCheck={false} />
          </Field>
          <Field label="Senha" htmlFor="senha" hint="Mínimo 6 caracteres.">
            <Input id="senha" name="senha" type="password" placeholder="••••••" required autoComplete="new-password" />
          </Field>
          <Field label="Foto (opcional)" htmlFor="foto_url">
            <Input id="foto_url" name="foto_url" placeholder="https://…" autoComplete="off" />
          </Field>

          {estado.erro && (
            <Alert icon={<WarningCircleIcon weight="fill" />} className="sm:col-span-2">
              {estado.erro}
            </Alert>
          )}
          {estado.sucesso && (
            <Alert tom="accent" icon={<CheckCircleIcon weight="fill" />} className="sm:col-span-2">
              Ligador criado. Agora entre numa rifa e distribua fichas pra ele.
            </Alert>
          )}

          <Button type="submit" disabled={pendente} icon={<UserPlusIcon weight="bold" />} className="sm:col-span-2">
            {pendente ? "Criando…" : "Criar ligador"}
          </Button>
        </form>
      )}
    </Card>
  );
}
