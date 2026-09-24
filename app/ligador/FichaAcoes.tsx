"use client";

import { useState, useTransition } from "react";
import { ArrowCounterClockwiseIcon, CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Layout";
import { marcarStatus } from "./actions";
import type { FichaStatus } from "@/lib/types";

/** Observação + Deu bom / Deu ruim. `compacto` é a versão do card da fila. */
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
        <Button
          size={compacto ? "sm" : "lg"}
          disabled={pendente}
          onClick={() => marcar("deu_bom")}
          icon={<CheckCircleIcon weight="fill" />}
        >
          Deu bom
        </Button>
        <Button
          size={compacto ? "sm" : "lg"}
          variant="danger"
          disabled={pendente}
          onClick={() => marcar("deu_ruim")}
          icon={<XCircleIcon weight="fill" />}
        >
          Deu ruim
        </Button>
      </div>
      {status !== "pendente" && (
        <Button
          size="sm"
          variant="ghost"
          block
          disabled={pendente}
          onClick={() => marcar("pendente")}
          icon={<ArrowCounterClockwiseIcon />}
        >
          Voltar pra pendente
        </Button>
      )}
    </div>
  );
}
