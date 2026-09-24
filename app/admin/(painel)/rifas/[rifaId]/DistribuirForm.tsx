"use client";

import { useActionState, useState } from "react";
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
  // Texto cru do campo; o limite vem de `disponiveis` na hora de renderizar (ele cai
  // depois de cada envio, e pedir mais que o disponível só manda o que tem).
  const [texto, setTexto] = useState(String(Math.min(50, disponiveis)));
  const pedido = Number.parseInt(texto, 10);
  const enviar = Number.isInteger(pedido) && pedido > 0 ? Math.min(pedido, disponiveis) : 0;

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
        <input type="hidden" name="quantidade" value={enviar} />

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

        <Field
          label="Quantidade"
          htmlFor="quantidade"
          hint={semEstoque ? undefined : `Máximo ${formatNumero(disponiveis)}. Vai pegar as mais antigas primeiro.`}
        >
          <div className="flex flex-col gap-2">
            <Input
              id="quantidade"
              type="number"
              inputMode="numeric"
              min={1}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              disabled={semLigador || semEstoque}
              className="font-mono tabular-nums"
            />
            <div className="flex flex-wrap gap-1.5">
              {ATALHOS.filter((n) => n < disponiveis).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTexto(String(n))}
                  className={`h-7 rounded-full border px-3 text-xs font-medium transition-colors duration-300 ease-spring ${
                    enviar === n
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
                  onClick={() => setTexto(String(disponiveis))}
                  className={`h-7 rounded-full border px-3 text-xs font-medium transition-colors duration-300 ease-spring ${
                    enviar === disponiveis
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
          disabled={pendente || semLigador || semEstoque || enviar < 1}
          icon={<PaperPlaneTiltIcon weight="fill" />}
        >
          {pendente
            ? "Enviando…"
            : semEstoque
              ? "Nada pra enviar"
              : enviar < 1
                ? "Digite a quantidade"
                : `Enviar ${formatNumero(enviar)} ficha(s)`}
        </Button>
      </form>
    </Card>
  );
}
