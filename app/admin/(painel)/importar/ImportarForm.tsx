"use client";

import { useActionState, useRef, useState, type DragEvent, type ReactNode } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  FileTextIcon,
  PaperPlaneTiltIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Layout";
import { formatNumero } from "@/lib/format";
import { FORMATOS } from "@/lib/import/formatos";
import { importarFichas, type EstadoImport } from "./actions";

const TAMANHO_MAXIMO = 24 * 1024 * 1024;
const fmt = FORMATOS.familhao;

type Previa = { nome: string; tamanho: number; fichas: number; compras: number; semTelefone: number };

export function ImportarForm() {
  const [rodada, setRodada] = useState(0);
  return <Formulario key={rodada} onNovo={() => setRodada((r) => r + 1)} />;
}

function Formulario({ onNovo }: { onNovo: () => void }) {
  const arquivoAtual = useRef<File | null>(null);
  const [estado, formAction, pendente] = useActionState<EstadoImport, FormData>((anterior, dados) => {
    if (arquivoAtual.current) dados.set("arquivo", arquivoAtual.current);
    return importarFichas(anterior, dados);
  }, {});
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [lendo, setLendo] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  async function lerArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    if (arquivo.size > TAMANHO_MAXIMO) {
      arquivoAtual.current = null;
      setPrevia(null);
      setErroArquivo(
        `Arquivo de ${formatNumero(Math.round(arquivo.size / 1024 / 1024))} MB — o limite é 24 MB. Divida o arquivo em partes e importe uma de cada vez (não duplica).`,
      );
      return;
    }
    arquivoAtual.current = arquivo;
    setErroArquivo(null);
    setLendo(true);
    try {
      const { fichas, compras } = fmt.ler(await arquivo.text());
      setPrevia({
        nome: arquivo.name,
        tamanho: arquivo.size,
        fichas: fichas.length,
        compras,
        semTelefone: fichas.filter((f) => !f.telefone).length,
      });
    } finally {
      setLendo(false);
    }
  }

  function aoSoltar(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setArrastando(false);
    const arquivos = e.dataTransfer.files;
    if (!arquivos.length || !inputArquivo.current) return;
    inputArquivo.current.files = arquivos;
    void lerArquivo(arquivos[0]);
  }

  if (estado.resumo) return <Sucesso resumo={estado.resumo} onNovo={onNovo} />;

  const arquivoOk = Boolean(previa && previa.fichas > 0);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Arquivo" description={fmt.arquivo} />
        <div className="flex flex-col gap-4 p-5">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={aoSoltar}
            className={`group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed px-5 transition-[background-color,border-color] duration-300 ease-spring ${
              previa ? "py-4" : "flex-col justify-center py-10 text-center"
            } ${
              arrastando
                ? "border-accent/60 bg-accent-soft"
                : "border-line-strong bg-surface-2 hover:border-accent/40 hover:bg-surface-3"
            }`}
          >
            <input
              ref={inputArquivo}
              type="file"
              name="arquivo"
              accept={fmt.extensoes}
              className="sr-only"
              onChange={(e) => void lerArquivo(e.target.files?.[0])}
            />
            {previa ? (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-fg-muted">
                  <FileTextIcon size={20} weight="fill" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[14px] font-medium text-fg">{previa.nome}</span>
                  <span className="block text-[12px] text-fg-subtle">{formatNumero(Math.ceil(previa.tamanho / 1024))} KB</span>
                </span>
                <span className="shrink-0 text-[13px] font-medium text-fg-muted group-hover:text-fg">Trocar</span>
              </>
            ) : (
              <>
                <span className="flex size-12 items-center justify-center rounded-2xl border border-line-strong bg-surface-3 text-fg-muted transition-transform duration-500 ease-spring group-hover:-translate-y-0.5">
                  <UploadSimpleIcon size={22} weight="bold" />
                </span>
                <span className="text-[14px] font-medium text-fg">
                  {lendo ? "Lendo o arquivo…" : fmt.dica}
                </span>
                <span className="text-[12.5px] text-fg-subtle">Nada é salvo até você confirmar.</span>
              </>
            )}
          </label>

          {erroArquivo && <Alert icon={<WarningCircleIcon weight="fill" />}>{erroArquivo}</Alert>}

          {previa && previa.fichas === 0 && (
            <Alert icon={<WarningCircleIcon weight="fill" />}>
              Não achei nenhuma ficha nesse arquivo. Confira se é o {fmt.arquivo}: {fmt.descricao}
            </Alert>
          )}

          {previa && previa.fichas > 0 && (
            <div className="grid animate-fade-in grid-cols-3 gap-2">
              <Numero label="Fichas" valor={previa.fichas} destaque />
              <Numero label="Linhas no arquivo" valor={previa.fichas} />
              <Numero label="Sem telefone" valor={previa.semTelefone} alerta={previa.semTelefone > 0} />
            </div>
          )}
        </div>
      </Card>

      {estado.erro && <Alert icon={<WarningCircleIcon weight="fill" />}>{estado.erro}</Alert>}

      <Button
        type="submit"
        size="lg"
        block
        disabled={pendente || lendo || !arquivoOk}
        icon={<PaperPlaneTiltIcon weight="fill" />}
      >
        {pendente
          ? "Importando…"
          : !arquivoOk
            ? "Escolha o arquivo"
            : `Importar ${formatNumero(previa!.fichas)} ficha(s) no Familhão`}
      </Button>
    </form>
  );
}

function Numero({ label, valor, destaque, alerta }: { label: string; valor: number; destaque?: boolean; alerta?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-line bg-surface-2 px-3 py-3 sm:px-3.5">
      <p className="text-[11.5px] leading-tight text-fg-subtle">{label}</p>
      <p
        className={`mt-1.5 truncate font-mono text-[18px] font-medium leading-none tracking-[-0.03em] tabular-nums sm:text-[22px] ${
          destaque ? "text-accent" : alerta ? "text-warning" : "text-fg"
        }`}
      >
        {formatNumero(valor)}
      </p>
    </div>
  );
}

function Sucesso({ resumo, onNovo }: { resumo: NonNullable<EstadoImport["resumo"]>; onNovo: () => void }) {
  const total = resumo.novas + resumo.atualizadas;
  return (
    <Card className="animate-fade-up">
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-accent">
          <CheckCircleIcon size={30} weight="fill" />
        </span>
        <p className="text-[13px] text-fg-subtle">
          Importado no <span className="font-medium text-fg">Familhão</span>
        </p>
        <p className="mt-2 font-mono text-[40px] font-medium leading-none tracking-[-0.04em] tabular-nums text-fg">
          {formatNumero(total)}
          <span className="ml-2 font-sans text-[16px] font-normal tracking-normal text-fg-muted">fichas</span>
        </p>
        <p className="mt-3 text-[13.5px] text-fg-muted">
          <span className="text-accent">{formatNumero(resumo.novas)} novas</span>
          {resumo.atualizadas > 0 && <> · {formatNumero(resumo.atualizadas)} já existiam e foram atualizadas</>}
        </p>
        {resumo.semTelefone > 0 && (
          <p className="mt-1.5 text-[12.5px] text-warning">{formatNumero(resumo.semTelefone)} sem telefone no arquivo</p>
        )}
        <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <ButtonLink
            href="/admin"
            size="lg"
            trailingIcon={<ArrowRightIcon size={16} weight="bold" />}
          >
            Distribuir pros ligadores
          </ButtonLink>
          <Button size="lg" variant="secondary" onClick={onNovo} icon={<UploadSimpleIcon weight="bold" />}>
            Importar outro arquivo
          </Button>
        </div>
      </div>
    </Card>
  );
}
