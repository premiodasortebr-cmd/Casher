"use client";

import { useActionState, useRef, useState, type DragEvent, type ReactNode } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  FileTextIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  TicketIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Layout";
import { Badge } from "@/components/ui/Badge";
import { formatNumero } from "@/lib/format";
import { parseFichas } from "@/lib/import/parseFichas";
import { importarFichas, type EstadoImport } from "./actions";

type RifaOpcao = { id: string; nome: string; total: number };
type Previa = { nome: string; tamanho: number; fichas: number; compras: number; semTelefone: number };

export function ImportarForm({ rifas, rifaInicial }: { rifas: RifaOpcao[]; rifaInicial: string }) {
  // Trocar a key remonta tudo: "Importar outro arquivo" começa do zero.
  const [rodada, setRodada] = useState(0);
  return (
    <Formulario
      key={rodada}
      rifas={rifas}
      rifaInicial={rodada === 0 ? rifaInicial : ""}
      onNovo={() => setRodada((r) => r + 1)}
    />
  );
}

function Formulario({
  rifas,
  rifaInicial,
  onNovo,
}: {
  rifas: RifaOpcao[];
  rifaInicial: string;
  onNovo: () => void;
}) {
  const [estado, formAction, pendente] = useActionState<EstadoImport, FormData>(importarFichas, {});
  const [rifaSel, setRifaSel] = useState(rifaInicial || (rifas.length === 0 ? "nova" : ""));
  const [novaNome, setNovaNome] = useState("");
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [lendo, setLendo] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  async function lerArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    setLendo(true);
    try {
      const { fichas, compras } = parseFichas(await arquivo.text());
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

  const rifaEscolhida = rifas.find((r) => r.id === rifaSel);
  const nomeDestino = rifaSel === "nova" ? novaNome.trim() : rifaEscolhida?.nome;
  const rifaOk = rifaSel === "nova" ? novaNome.trim().length >= 2 : Boolean(rifaEscolhida);
  const arquivoOk = Boolean(previa && previa.fichas > 0);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="rifaId" value={rifaSel} />

      <Card>
        <CardHeader title={<Passo n={1} ok={rifaOk}>Rifa</Passo>} description="Pra onde vão as fichas deste arquivo" />
        <div className="flex flex-col gap-4 p-5">
          <div role="radiogroup" aria-label="Rifa" className="grid gap-2 sm:grid-cols-2">
            {rifas.map((r) => (
              <OpcaoRifa key={r.id} ativa={rifaSel === r.id} onClick={() => setRifaSel(r.id)}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-fg-muted">
                  <TicketIcon size={18} weight="fill" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-fg">{r.nome}</span>
                  <span className="block text-[12px] text-fg-subtle">{formatNumero(r.total)} fichas</span>
                </span>
              </OpcaoRifa>
            ))}
            <OpcaoRifa ativa={rifaSel === "nova"} onClick={() => setRifaSel("nova")} tracejada>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-dashed border-line-strong text-fg-muted">
                <PlusIcon size={16} weight="bold" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-fg">Nova rifa</span>
                <span className="block text-[12px] text-fg-subtle">Cria agora e já importa</span>
              </span>
            </OpcaoRifa>
          </div>

          {rifaSel === "nova" && (
            <Field label="Nome da nova rifa" htmlFor="novaRifa" className="animate-fade-in">
              <Input
                id="novaRifa"
                name="novaRifa"
                value={novaNome}
                onChange={(e) => setNovaNome(e.target.value)}
                placeholder="Ex.: Bolada Pix"
                maxLength={60}
                autoFocus={rifas.length > 0}
                autoComplete="off"
              />
            </Field>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title={<Passo n={2} ok={arquivoOk}>Arquivo</Passo>}
          description="O .txt exportado pelo checker"
        />
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
              accept=".txt,text/plain"
              required
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
                  {lendo ? "Lendo o arquivo…" : "Arraste o .txt aqui ou clique pra escolher"}
                </span>
                <span className="text-[12.5px] text-fg-subtle">Nada é salvo até você confirmar.</span>
              </>
            )}
          </label>

          {previa && previa.fichas === 0 && (
            <Alert icon={<WarningCircleIcon weight="fill" />}>
              Não achei nenhuma ficha nesse arquivo. Confira se é o .txt do checker (blocos &quot;=== CPF … ===&quot; com
              &quot;Compra N&quot; dentro).
            </Alert>
          )}

          {previa && previa.fichas > 0 && (
            <div className="grid animate-fade-in grid-cols-3 gap-2">
              <Numero label="Fichas" valor={previa.fichas} destaque />
              <Numero label="Compras no arquivo" valor={previa.compras} />
              <Numero label="Sem telefone" valor={previa.semTelefone} alerta={previa.semTelefone > 0} />
              {previa.compras > previa.fichas && (
                <p className="col-span-3 text-[12.5px] text-fg-subtle">
                  {formatNumero(previa.compras - previa.fichas)} compra(s) eram da mesma pessoa — viraram uma ficha só.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {estado.erro && <Alert icon={<WarningCircleIcon weight="fill" />}>{estado.erro}</Alert>}

      <Button
        type="submit"
        size="lg"
        block
        disabled={pendente || lendo || !rifaOk || !arquivoOk}
        icon={<PaperPlaneTiltIcon weight="fill" />}
      >
        {pendente
          ? "Importando…"
          : !rifaOk
            ? "Escolha a rifa"
            : !arquivoOk
              ? "Escolha o arquivo"
              : `Importar ${formatNumero(previa!.fichas)} ficha(s) em ${nomeDestino}`}
      </Button>
    </form>
  );
}

function Passo({ n, ok, children }: { n: number; ok: boolean; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`flex size-6 items-center justify-center rounded-full text-[12px] font-semibold transition-colors duration-300 ease-spring ${
          ok ? "bg-accent text-accent-fg" : "bg-surface-3 text-fg-muted"
        }`}
      >
        {ok ? <CheckIcon size={12} weight="bold" /> : n}
      </span>
      {children}
    </span>
  );
}

function OpcaoRifa({
  ativa,
  onClick,
  tracejada,
  children,
}: {
  ativa: boolean;
  onClick: () => void;
  tracejada?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativa}
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-[background-color,border-color,box-shadow] duration-300 ease-spring ${
        ativa
          ? "border-accent-line bg-accent-soft shadow-[0_0_0_3px_rgb(63_200_115/0.08)]"
          : `${tracejada ? "border-dashed" : ""} border-line-strong bg-surface-2 hover:border-white/20 hover:bg-surface-3`
      }`}
    >
      {children}
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ease-spring ${
          ativa ? "border-accent bg-accent text-accent-fg" : "border-line-strong"
        }`}
      >
        {ativa && <CheckIcon size={11} weight="bold" />}
      </span>
    </button>
  );
}

function Numero({ label, valor, destaque, alerta }: { label: string; valor: number; destaque?: boolean; alerta?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-3">
      <p className="text-[11.5px] text-fg-subtle">{label}</p>
      <p
        className={`mt-1 font-mono text-[22px] font-medium leading-none tracking-[-0.03em] tabular-nums ${
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
          Importado em{" "}
          <span className="font-medium text-fg">{resumo.rifaNome}</span>
          {resumo.rifaCriada && (
            <Badge tom="accent" className="ml-2 align-middle">
              rifa nova
            </Badge>
          )}
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
            href={`/admin/rifas/${resumo.rifaId}`}
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
