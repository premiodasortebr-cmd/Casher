"use client";

import { useActionState } from "react";
import { SparkleIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { PinInput } from "@/components/ui/PinInput";
import { Alert } from "@/components/ui/Layout";
import { gerarValoresHospedagem, type EstadoGerador } from "./actions";

const estadoInicial: EstadoGerador = {};

function Valor({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <code className="text-[12px] font-medium text-accent">{nome}</code>
        <CopyButton valor={valor} label={`Copiar ${nome}`} />
      </div>
      <code className="block break-all font-mono text-[11.5px] leading-relaxed text-fg-muted">{valor}</code>
    </div>
  );
}

export function GeradorHospedagem() {
  const [estado, formAction, pendente] = useActionState(gerarValoresHospedagem, estadoInicial);

  if (estado.adminPinHash && estado.sessionSecret) {
    return (
      <div className="flex animate-fade-up flex-col gap-3">
        <Valor nome="ADMIN_PIN_HASH" valor={estado.adminPinHash} />
        <Valor nome="SESSION_SECRET" valor={estado.sessionSecret} />
        <p className="text-[12.5px] leading-relaxed text-fg-subtle">
          Cole no Render (Environment) e faça um novo deploy. O SESSION_SECRET só é necessário se
          você não usou o render.yaml — ele já gera um sozinho.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-fg-muted">Escolha o PIN do /admin</span>
        <PinInput name="pin" />
      </div>
      {estado.erro && <Alert icon={<WarningCircleIcon weight="fill" />}>{estado.erro}</Alert>}
      <Button
        type="submit"
        size="lg"
        block
        disabled={pendente}
        icon={<SparkleIcon weight="fill" />}
      >
        {pendente ? "Gerando…" : "Gerar valores"}
      </Button>
    </form>
  );
}
