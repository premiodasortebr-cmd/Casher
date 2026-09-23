"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircleIcon, PaperPlaneTiltIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Layout";
import { formatNumero } from "@/lib/format";
import { distribuirFichas, type EstadoDistribuicao } from "./actions";

const ATALHOS = [25, 50, 100, 200];

export function DistribuirForm({
  rifaId,
  disponiveis,
  ligadores,
}: {
  rifaId: string;
  disponiveis: number;
  ligadores: { id: string; nome: string; pendentes: number }[];
}) {
  const [estado, formAction, pendente] = useActionState<EstadoDistribuicao, FormData>(distribuirFichas, {});
  const [quantidade, setQuantidade] = useState(Math.min(50, disponiveis));

  // Depois de enviar, o servidor recalcula `disponiveis`; realinha o campo.
  useEffect(() => {
    setQuantidade((q) => Math.min(Math.max(q, 1), Math.max(disponiveis, 1)));
  }, [disponiveis]);

  const semEstoque = disponiveis === 0;
  const semLigador = ligadores.length === 0;

  return (
    <Card>
      <CardHeader
        title="Distribuir fichas"
        description={
          semEstoque
            ? "Nenhuma ficha disponível — todas já estão com algum ligador ou foram marcadas."
            : `${formatNumero(disponiveis)} disponíveis pra enviar`
        }
      />
      <form action={formAction} className="flex flex-col gap-4 p-5">
        <input type="hidden" name="rifaId" value={rifaId} />

        <Field label="Ligador" htmlFor="ligadorId">
          <Select id="ligadorId" name="ligadorId" required disabled={semLigador || semEstoque}>
            {semLigador ? (
              <option value="">Nenhum ligador ativo</option>
            ) : (
              ligadores.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                  {l.pendentes > 0 ? ` · ${l.pendentes} pendentes` : ""}
                </option>
              ))
            )}
          </Select>
        </Field>

        <Field label="Quantidade" htmlFor="quantidade" hint={`Máximo ${formatNumero(disponiveis)}. Vai pegar as mais antigas primeiro.`}>
          <div className="flex flex-col gap-2">
            <Input
              id="quantidade"
              name="quantidade"
              type="number"
              inputMode="numeric"
              min={1}
              max={Math.max(disponiveis, 1)}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              disabled={semLigador || semEstoque}
              className="font-mono tabular-nums"
            />
            <div className="flex flex-wrap gap-1.5">
              {ATALHOS.filter((n) => n < disponiveis).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantidade(n)}
                  className={`h-7 rounded-full border px-3 text-xs font-medium transition-colors duration-300 ease-spring ${
                    quantidade === n
                      ? "border-accent-line bg-accent-soft text-accent"
                      : "border-line-strong bg-white/[0.03] text-fg-muted hover:text-fg"
                  }`}
                >
                  {n}
                </button>
              ))}
              {!semEstoque && (
                <button
                  type="button"
                  onClick={() => setQuantidade(disponiveis)}
                  className={`h-7 rounded-full border px-3 text-xs font-medium transition-colors duration-300 ease-spring ${
                    quantidade === disponiveis
                      ? "border-accent-line bg-accent-soft text-accent"
                      : "border-line-strong bg-white/[0.03] text-fg-muted hover:text-fg"
                  }`}
                >
                  Todas ({formatNumero(disponiveis)})
                </button>
              )}
            </div>
          </div>
        </Field>

        {estado.erro && <Alert icon={<WarningCircleIcon weight="fill" />}>{estado.erro}</Alert>}
        {estado.enviadas != null && !estado.erro && (
          <Alert tom="accent" icon={<CheckCircleIcon weight="fill" />}>
            {formatNumero(estado.enviadas)} ficha(s) enviadas pra {estado.ligadorNome}.
          </Alert>
        )}

        <Button
          type="submit"
          size="lg"
          block
          disabled={pendente || semLigador || semEstoque || quantidade < 1}
          icon={<PaperPlaneTiltIcon weight="fill" />}
        >
          {pendente ? "Enviando…" : `Enviar ${formatNumero(Math.min(quantidade, disponiveis))} ficha(s)`}
        </Button>
      </form>
    </Card>
  );
}
