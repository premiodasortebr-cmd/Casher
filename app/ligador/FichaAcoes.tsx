"use client";

import { useState, useTransition } from "react";
import { ArrowClockwiseIcon, ArrowCounterClockwiseIcon, CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Layout";
import { marcarStatus } from "./actions";
import type { FichaStatus } from "@/lib/types";

/** Observação + Deu bom / Deu ruim / Retornar. `compacto` é a versão do card da fila. */
export function FichaAcoes({
  fichaId,
  status,
  observacao: inicial,
  compacto = false,
}: {
  fichaId: string;
  status: FichaStatus;
  observacao: string | null;
  compacto?: boolean;
}) {
  const [observacao, setObservacao] = useState(inicial ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();
  const tamanho = compacto ? "sm" : "lg";

  function marcar(novo: FichaStatus) {
    startTransition(async () => {
      const r = await marcarStatus(fichaId, novo, observacao.trim() || undefined);
      setErro(r.erro ?? null);
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {compacto ? (
        <Input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observação (opcional)"
          className="text-[13.5px]"
        />
      ) : (
        <Textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observação: como foi a ligação, o que a pessoa disse, quando ligar de novo…"
          rows={3}
        />
      )}

      {erro && <Alert icon={<XCircleIcon weight="fill" />}>{erro}</Alert>}

      <div className="grid grid-cols-2 gap-2">
        <Button size={tamanho} disabled={pendente} onClick={() => marcar("deu_bom")} icon={<CheckCircleIcon weight="fill" />}>
          Deu bom
        </Button>
        <Button
          size={tamanho}
          variant="danger"
          disabled={pendente}
          onClick={() => marcar("deu_ruim")}
          icon={<XCircleIcon weight="fill" />}
        >
          Deu ruim
        </Button>
      </div>
      <Button
        size={tamanho}
        variant="secondary"
        block
        disabled={pendente || status === "retornar"}
        onClick={() => marcar("retornar")}
        icon={<ArrowClockwiseIcon weight="bold" />}
      >
        {status === "retornar" ? "Marcada pra retornar" : "Retornar — não atendeu"}
      </Button>
      {(status === "deu_bom" || status === "deu_ruim") && (
        <Button
          size="sm"
          variant="ghost"
          block
          disabled={pendente}
          onClick={() => marcar("pendente")}
          icon={<ArrowCounterClockwiseIcon />}
        >
          Voltar pra fila
        </Button>
      )}
    </div>
  );
}
