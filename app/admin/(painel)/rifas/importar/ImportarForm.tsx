"use client";

import { useActionState } from "react";
import { CheckCircleIcon, FileArrowUpIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Layout";
import { importarFichas, type EstadoImport } from "./actions";

const estadoInicial: EstadoImport = {};

export function ImportarForm() {
  const [estado, formAction, pendente] = useActionState(importarFichas, estadoInicial);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Arquivo do checker" description="Selecione o .txt exportado" />
        <form action={formAction} className="flex flex-col gap-4 p-5">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface-2 px-4 py-8 text-center transition-colors duration-300 ease-spring hover:border-accent/40 hover:bg-surface-3">
            <FileArrowUpIcon size={28} className="text-fg-subtle" />
            <span className="text-sm font-medium text-fg">Clique para escolher o arquivo</span>
            <span className="text-[12.5px] text-fg-subtle">Apenas arquivos .txt</span>
            <input type="file" name="arquivo" accept=".txt" required className="sr-only" />
          </label>

          {estado.erro && <Alert icon={<WarningCircleIcon weight="fill" />}>{estado.erro}</Alert>}

          <Button type="submit" disabled={pendente} icon={<FileArrowUpIcon weight="bold" />}>
            {pendente ? "Importando…" : "Importar"}
          </Button>
        </form>
      </Card>

      {estado.resumo && (
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2 text-accent">
                <CheckCircleIcon weight="fill" />
                Importação concluída
              </span>
            }
            description={`${estado.resumo.totalRifas} rifa(s), ${estado.resumo.totalFichas} ficha(s)`}
          />
          <ul className="divide-y divide-line px-5">
            {estado.resumo.detalhes.map((d) => (
              <li key={d.nome} className="flex items-center justify-between py-3 text-[13.5px]">
                <span className="text-fg">{d.nome}</span>
                <span className="text-fg-subtle">{d.fichas} ficha(s)</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
