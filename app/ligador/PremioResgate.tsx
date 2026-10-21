"use client";

import { useState, useTransition } from "react";
import {
  ClipboardTextIcon,
  CurrencyDollarIcon,
  LockKeyIcon,
  LockKeyOpenIcon,
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  FloppyDiskIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import type { PremioResgate as Premio } from "@/lib/types";
import {
  definirCodigoPremio,
  definirValorPremio,
  definirEstadoPremio,
  resetarPremio,
} from "./actions";

function maskCentavos(v: string) {
  const n = v.replace(/\D/g, "");
  if (!n) return "";
  const centavos = parseInt(n, 10);
  return (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function parseCentavos(v: string): number {
  const n = v.replace(/\D/g, "");
  return parseInt(n || "0", 10) / 100;
}

export function PremioResgateCard({
  fichaId,
  premio,
}: {
  fichaId: string;
  premio: Premio | null;
}) {
  const [codigo, setCodigo] = useState(premio?.codigo ?? "");
  const [valorStr, setValorStr] = useState(
    maskCentavos(String(Math.round((premio?.valor || 20000) * 100))),
  );
  const [pendente, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function salvarCodigo() {
    start(async () => {
      const r = await definirCodigoPremio(fichaId, codigo);
      setMsg(r.erro ?? "Código salvo!");
      setTimeout(() => setMsg(null), 2000);
    });
  }

  function salvarValor() {
    const valor = parseCentavos(valorStr);
    start(async () => {
      const r = await definirValorPremio(fichaId, valor);
      setMsg(r.erro ?? "Valor salvo!");
      setTimeout(() => setMsg(null), 2000);
    });
  }

  function liberar() {
    start(async () => {
      const r = await definirEstadoPremio(fichaId, "liberado");
      setMsg(r.erro ?? "Liberado!");
      setTimeout(() => setMsg(null), 2000);
    });
  }

  function parcial() {
    start(async () => {
      const r = await definirEstadoPremio(fichaId, "pagamento_parcial");
      setMsg(r.erro ?? "Pagamento parcial!");
      setTimeout(() => setMsg(null), 2000);
    });
  }

  function resetar() {
    start(async () => {
      const r = await resetarPremio(fichaId);
      if (r.erro) { setMsg(r.erro); } else {
        setCodigo("");
        setValorStr("");
        setMsg("Prêmio resetado.");
      }
      setTimeout(() => setMsg(null), 2000);
    });
  }

  async function colar() {
    try {
      const texto = await navigator.clipboard.readText();
      if (texto.trim()) setCodigo(texto.trim());
    } catch { /* clipboard blocked */ }
  }

  const estado = premio?.estado ?? "bloqueado";
  const estadoLabel =
    estado === "liberado" ? "Liberado" : estado === "pagamento_parcial" ? "Pgto Parcial" : "Bloqueado";
  const estadoCor =
    estado === "liberado"
      ? "text-accent"
      : estado === "pagamento_parcial"
        ? "text-warning"
        : "text-fg-subtle";

  return (
    <Card>
      <CardHeader
        title="Prêmio"
        description={
          <span className={estadoCor}>
            {estado === "liberado" ? <LockKeyOpenIcon size={14} weight="fill" className="inline mr-1" /> : <LockKeyIcon size={14} weight="fill" className="inline mr-1" />}
            {estadoLabel}
            {premio?.pix_chave && (
              <span className="ml-2 text-fg-subtle">
                · Pix: {premio.pix_tipo} — {premio.pix_chave}
              </span>
            )}
          </span>
        }
      />
      <div className="flex flex-col gap-4 p-5">
        {/* Código do prêmio */}
        <div>
          <label className="mb-1.5 block text-[11.5px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
            Código do prêmio
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Cole o código aqui"
              className="h-10 flex-1 rounded-xl border border-line-strong bg-surface-2 px-3 font-mono text-sm text-fg placeholder:text-fg-subtle outline-none transition-all duration-300 focus:border-accent/60"
            />
            <button
              type="button"
              onClick={colar}
              disabled={pendente}
              title="Colar da área de transferência"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-surface-2 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg active:scale-95"
            >
              <ClipboardTextIcon size={18} />
            </button>
            <button
              type="button"
              onClick={salvarCodigo}
              disabled={pendente}
              title="Salvar código"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg transition-colors hover:bg-accent-strong active:scale-95"
            >
              <FloppyDiskIcon size={18} weight="fill" />
            </button>
          </div>
        </div>

        {/* Valor do prêmio */}
        <div>
          <label className="mb-1.5 block text-[11.5px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
            Valor do prêmio (R$)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fg-subtle">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={valorStr}
                onChange={(e) => setValorStr(maskCentavos(e.target.value))}
                placeholder="0,00"
                className="h-10 w-full rounded-xl border border-line-strong bg-surface-2 pl-9 pr-3 font-mono text-sm text-fg placeholder:text-fg-subtle outline-none transition-all duration-300 focus:border-accent/60"
              />
            </div>
            <button
              type="button"
              onClick={salvarValor}
              disabled={pendente}
              title="Salvar valor"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg transition-colors hover:bg-accent-strong active:scale-95"
            >
              <FloppyDiskIcon size={18} weight="fill" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            disabled={pendente || estado === "liberado"}
            onClick={liberar}
            icon={<LockKeyOpenIcon weight="fill" />}
          >
            Liberar
          </Button>
          <Button
            size="sm"
            variant="warning"
            disabled={pendente}
            onClick={parcial}
            icon={<CurrencyDollarIcon weight="fill" />}
          >
            Pgto Parcial
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          block
          disabled={pendente}
          onClick={resetar}
          icon={<ArrowCounterClockwiseIcon />}
        >
          Resetar prêmio
        </Button>

        {msg && (
          <p className={`text-center text-sm ${msg.includes("!") && !msg.includes("Erro") ? "text-accent" : "text-danger"}`}>
            {msg}
          </p>
        )}
      </div>
    </Card>
  );
}
