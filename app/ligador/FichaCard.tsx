"use client";

import { useState, useTransition } from "react";
import { CheckCircleIcon, PhoneIcon, WhatsappLogoIcon, XCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Layout";
import { formatCPF, telHref, whatsappHref } from "@/lib/format";
import { marcarStatus } from "./actions";
import type { FichaStatus } from "@/lib/types";

interface Props {
  id: string;
  cpf: string;
  nome: string;
  telefone: string | null;
  status: FichaStatus;
  observacao: string | null;
}

export function FichaCard({ ficha, rifaNome }: { ficha: Props; rifaNome: string | null }) {
  const [observacao, setObservacao] = useState(ficha.observacao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function marcar(status: FichaStatus) {
    startTransition(async () => {
      const resultado = await marcarStatus(ficha.id, status, observacao || undefined);
      setErro(resultado.erro ?? null);
    });
  }

  const wa = whatsappHref(ficha.telefone);
  const tel = telHref(ficha.telefone);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {rifaNome && <p className="mb-1 truncate text-[11px] uppercase tracking-[0.12em] text-fg-subtle">{rifaNome}</p>}
          <p className="font-medium text-fg">{ficha.nome}</p>
          <p className="mt-0.5 font-mono text-[12.5px] tabular-nums text-fg-subtle">
            {formatCPF(ficha.cpf)}
            {ficha.telefone && ` · ${ficha.telefone}`}
          </p>
        </div>
        <StatusBadge status={ficha.status} className="shrink-0" />
      </div>

      {(wa || tel) && (
        <div className="mt-3 flex gap-2">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-accent-line bg-accent-soft text-[13px] font-medium text-accent transition-colors duration-300 ease-spring hover:bg-accent/15 active:scale-[0.98]"
            >
              <WhatsappLogoIcon size={17} weight="fill" />
              WhatsApp
            </a>
          )}
          {tel && (
            <a
              href={tel}
              aria-label="Ligar"
              title="Ligar"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-2 text-fg-muted transition-colors duration-300 ease-spring hover:bg-surface-3 hover:text-fg active:scale-[0.96]"
            >
              <PhoneIcon size={16} weight="fill" />
            </a>
          )}
        </div>
      )}

      <Input
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Observação (opcional)"
        className="mt-3 text-[13.5px]"
      />

      {erro && (
        <Alert className="mt-2.5" icon={<XCircleIcon weight="fill" />}>
          {erro}
        </Alert>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button size="sm" disabled={pendente} onClick={() => marcar("deu_bom")} icon={<CheckCircleIcon weight="fill" />}>
          Deu bom
        </Button>
        <Button size="sm" variant="danger" disabled={pendente} onClick={() => marcar("deu_ruim")} icon={<XCircleIcon weight="fill" />}>
          Deu ruim
        </Button>
        <Button size="sm" variant="secondary" disabled={pendente} onClick={() => marcar("pendente")}>
          Pendente
        </Button>
      </div>
    </Card>
  );
}
