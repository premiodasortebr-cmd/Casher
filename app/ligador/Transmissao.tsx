"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MonitorIcon,
  StopIcon,
  CircleIcon,
  WifiHighIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  suportaTransmissao,
  iniciarTransmissaoLigador,
} from "@/lib/transmissao";

export function TransmissaoCard({ ligadorId, onMudou }: { ligadorId: string; onMudou?: (t: boolean) => void }) {
  const [transmitindo, setTransmitindo] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [suporta] = useState(() => suportaTransmissao());
  const pararRef = useRef<(() => void) | null>(null);

  const iniciar = useCallback(async () => {
    setErro(null);
    try {
      const { parar } = await iniciarTransmissaoLigador({
        ligadorId,
        onFim: () => {
          setTransmitindo(false);
          setConectado(false);
          pararRef.current = null;
        },
        onConexao: (ok) => setConectado(ok),
      });
      pararRef.current = parar;
      setTransmitindo(true);
    } catch (e: any) {
      setErro(e.message || "Erro ao iniciar transmissão.");
    }
  }, [ligadorId]);

  const parar = useCallback(() => {
    pararRef.current?.();
    pararRef.current = null;
    setTransmitindo(false);
    setConectado(false);
  }, []);

  useEffect(() => {
    onMudou?.(transmitindo);
  }, [transmitindo, onMudou]);

  useEffect(() => {
    return () => { pararRef.current?.(); };
  }, []);

  if (!suporta) return null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <div className="border-b border-white/[0.06] px-4 py-3.5">
        <h3 className="text-[13px] font-semibold text-white/90">Transmissão de tela</h3>
        <p className="mt-0.5 text-[12px] text-white/40">
          {transmitindo ? (
            <span className="flex items-center gap-1.5">
              {conectado ? (
                <WifiHighIcon size={13} weight="fill" className="text-[#4ade80]" />
              ) : (
                <WifiSlashIcon size={13} weight="fill" className="text-[#eec26a]" />
              )}
              <CircleIcon size={7} weight="fill" className="animate-pulse text-[#f1787d]" />
              Transmitindo...
            </span>
          ) : (
            "Compartilhe sua tela para o admin acompanhar"
          )}
        </p>
      </div>
      <div className="p-4">
        {erro && (
          <p className="mb-3 rounded-lg border border-[#f1787d]/20 bg-[#f1787d]/10 p-3 text-[13px] text-[#f1787d]">{erro}</p>
        )}
        {transmitindo ? (
          <button
            type="button"
            onClick={parar}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#f1787d]/30 bg-[#f1787d]/15 text-[13px] font-semibold text-[#f1787d] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:bg-[#f1787d]/25 active:scale-[0.98]"
          >
            <StopIcon weight="fill" size={15} />
            Parar transmissão
          </button>
        ) : (
          <button
            type="button"
            onClick={iniciar}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-[20px] border border-[#7C3AED]/60 bg-[#7C3AED]/30 text-[13px] font-bold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:bg-[#7C3AED]/40 active:scale-[0.98]"
          >
            <MonitorIcon weight="fill" size={15} />
            Iniciar transmissão
          </button>
        )}
      </div>
    </div>
  );
}
