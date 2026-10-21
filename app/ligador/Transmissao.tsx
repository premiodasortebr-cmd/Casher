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
    <div className="rounded-3xl border border-white/15 bg-[#2D0A57]/80 backdrop-blur-sm">
      <div className="border-b border-white/10 px-5 py-4">
        <h3 className="text-sm font-black text-white">Transmissão de tela</h3>
        <p className="mt-0.5 text-[13px] text-white/50">
          {transmitindo ? (
            <span className="flex items-center gap-1.5">
              {conectado ? (
                <WifiHighIcon size={14} weight="fill" className="text-[#4ade80]" />
              ) : (
                <WifiSlashIcon size={14} weight="fill" className="text-[#eec26a]" />
              )}
              <CircleIcon size={8} weight="fill" className="animate-pulse text-[#f1787d]" />
              Transmitindo...
            </span>
          ) : (
            "Compartilhe sua tela para o admin acompanhar"
          )}
        </p>
      </div>
      <div className="p-5">
        {erro && (
          <p className="mb-3 rounded-2xl bg-[#f1787d]/10 p-3 text-sm text-[#f1787d]">{erro}</p>
        )}
        {transmitindo ? (
          <button
            type="button"
            onClick={parar}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#f1787d]/30 bg-[#f1787d]/15 text-sm font-bold text-[#f1787d] transition-all duration-300 hover:bg-[#f1787d]/25 active:scale-[0.97]"
          >
            <StopIcon weight="fill" size={16} />
            Parar transmissão
          </button>
        ) : (
          <button
            type="button"
            onClick={iniciar}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF97E2] to-[#FF2FC4] text-sm font-black text-white shadow-[0_4px_20px_-4px_rgb(255_47_196/0.5)] transition-all duration-300 hover:shadow-[0_6px_28px_-4px_rgb(255_47_196/0.7)] active:scale-[0.97]"
          >
            <MonitorIcon weight="fill" size={16} />
            Iniciar transmissão
          </button>
        )}
      </div>
    </div>
  );
}
