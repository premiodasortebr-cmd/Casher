"use client";

import { useActionState, useState, useTransition } from "react";
import { PencilSimpleIcon, TrashIcon, UploadSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { excluirRifa, renomearRifa, type EstadoRifa } from "../actions";

export function RifaAcoes({ rifaId, nome, vazia }: { rifaId: string; nome: string; vazia: boolean }) {
  const [editando, setEditando] = useState(false);
  // Controlado: o React reseta o form depois da action, e o erro "já existe X" tem
  // que continuar em cima do nome que a pessoa digitou.
  const [novoNome, setNovoNome] = useState(nome);
  const [estado, formAction, pendente] = useActionState<EstadoRifa, FormData>(async (anterior, dados) => {
    const r = await renomearRifa(anterior, dados);
    if (r.sucesso) setEditando(false);
    return r;
  }, {});
  const [excluindo, startExcluir] = useTransition();
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  if (editando) {
    return (
      <form action={formAction} className="flex w-full animate-fade-in flex-col gap-2 md:w-[26rem]">
        <input type="hidden" name="rifaId" value={rifaId} />
        <div className="flex gap-2">
          <Input
            name="nome"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            className="min-w-0 flex-1"
            maxLength={60}
            autoFocus
            autoComplete="off"
            aria-label="Novo nome da rifa"
            aria-invalid={Boolean(estado.erro) || undefined}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditando(false);
            }}
          />
          <Button type="submit" disabled={pendente} className="h-11">
            {pendente ? "Salvando…" : "Salvar"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditando(false)} className="h-11">
            Cancelar
          </Button>
        </div>
        {estado.erro && (
          <p className="flex items-center gap-1.5 text-[12.5px] text-danger">
            <WarningCircleIcon weight="fill" />
            {estado.erro}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-2 md:items-end">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          icon={<PencilSimpleIcon />}
          onClick={() => {
            setNovoNome(nome);
            setEditando(true);
          }}
        >
          Renomear
        </Button>
        {vazia && (
          <Button
            variant="danger"
            icon={<TrashIcon />}
            disabled={excluindo}
            onClick={() => {
              if (!confirm(`Excluir a rifa "${nome}"? Ela está vazia, nada mais é apagado.`)) return;
              startExcluir(async () => {
                const r = await excluirRifa(rifaId);
                if (r?.erro) setErroExcluir(r.erro);
              });
            }}
          >
            {excluindo ? "Excluindo…" : "Excluir"}
          </Button>
        )}
        <ButtonLink href={`/admin/rifas/importar?rifa=${rifaId}`} icon={<UploadSimpleIcon weight="bold" />}>
          Importar fichas
        </ButtonLink>
      </div>
      {erroExcluir && <p className="text-[12.5px] text-danger">{erroExcluir}</p>}
    </div>
  );
}
