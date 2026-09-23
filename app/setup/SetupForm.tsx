"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  DatabaseIcon,
  KeyIcon,
  LinkSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { PinInput } from "@/components/ui/PinInput";
import { Alert } from "@/components/ui/Layout";
import { salvarConfiguracao, type EstadoSetup } from "./actions";

const estadoInicial: EstadoSetup = {};

export function SetupForm({ modo, temBanco }: { modo: "novo" | "editar"; temBanco: boolean }) {
  const [estado, formAction, pendente] = useActionState(salvarConfiguracao, estadoInicial);
  const router = useRouter();
  const [contagem, setContagem] = useState(3);
  const editando = modo === "editar";

  useEffect(() => {
    if (!estado.sucesso) return;
    if (contagem === 0) {
      router.push(editando ? "/admin" : "/admin/login");
      router.refresh();
      return;
    }
    const t = setTimeout(() => setContagem((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [estado.sucesso, contagem, router, editando]);

  if (estado.sucesso) {
    const aplicadas = estado.migracoes?.filter((m) => m.status === "aplicada") ?? [];
    return (
      <div className="flex animate-fade-up flex-col items-center py-4 text-center">
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-accent">
          <CheckCircleIcon size={30} weight="fill" />
        </span>
        <p className="text-lg font-medium text-fg">Configuração salva</p>
        <p className="mt-1.5 text-[13.5px] text-fg-muted">
          {estado.migracoes
            ? aplicadas.length > 0
              ? `Banco atualizado: ${aplicadas.map((m) => m.arquivo).join(", ")}.`
              : "Banco já estava em dia."
            : "Sem connection string — as tabelas não foram verificadas."}
        </p>
        <p className="mt-6 text-[12.5px] text-fg-subtle">
          Redirecionando em {contagem}s… se travar, reinicie o <code className="text-fg-muted">npm run dev</code>.
        </p>
      </div>
    );
  }

  const opcional = editando ? "deixe vazio pra manter o atual" : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Project URL" htmlFor="supabaseUrl" hint={opcional ?? "Supabase → Project Settings → API"}>
        <Input
          id="supabaseUrl"
          name="supabaseUrl"
          placeholder="https://xxxxxxxx.supabase.co"
          required={!editando}
          autoComplete="off"
          spellCheck={false}
          icon={<LinkSimpleIcon />}
          className="font-mono text-[13.5px]"
        />
      </Field>

      <Field
        label="Service role key"
        htmlFor="serviceRoleKey"
        hint={opcional ?? "Mesma tela, chave service_role (nunca a anon/publishable)."}
      >
        <Input
          id="serviceRoleKey"
          name="serviceRoleKey"
          type="password"
          placeholder="eyJhbGciOi…"
          required={!editando}
          autoComplete="off"
          icon={<KeyIcon />}
          className="font-mono text-[13.5px]"
        />
      </Field>

      <Field
        label={
          <span className="flex items-center gap-2">
            Connection string do Postgres
            {temBanco && <span className="text-[11.5px] font-normal text-accent">já salva</span>}
          </span>
        }
        htmlFor="databaseUrl"
        hint={
          temBanco
            ? "Deixe vazio pra manter. É com ela que as tabelas são criadas/atualizadas sozinhas."
            : "Project Settings → Database → Connection string → Session pooler. Cria as tabelas sozinho."
        }
      >
        <Input
          id="databaseUrl"
          name="databaseUrl"
          type="password"
          placeholder="postgresql://postgres.xxxx:[senha]@aws-0-…pooler.supabase.com:5432/postgres"
          autoComplete="off"
          icon={<DatabaseIcon />}
          className="font-mono text-[13.5px]"
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-fg-muted">
          {editando ? "Novo PIN do /admin (opcional)" : "PIN de 6 números do /admin"}
        </span>
        <PinInput name="pin" invalid={Boolean(estado.erro?.includes("PIN"))} />
      </div>

      {estado.erro && (
        <Alert icon={<WarningCircleIcon weight="fill" />}>{estado.erro}</Alert>
      )}

      <Button
        type="submit"
        size="lg"
        block
        disabled={pendente}
        trailingIcon={<ArrowRightIcon size={16} weight="bold" />}
        className="mt-1"
      >
        {pendente ? "Salvando e conferindo o banco…" : editando ? "Salvar alterações" : "Salvar e continuar"}
      </Button>
    </form>
  );
}
