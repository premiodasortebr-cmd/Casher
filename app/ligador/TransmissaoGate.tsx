"use client";

import { useState, type ReactNode } from "react";
import { TransmissaoCard } from "./Transmissao";

export function TransmissaoGate({
  ligadorId,
  children,
}: {
  ligadorId: string;
  children: ReactNode;
}) {
  const [transmitindo, setTransmitindo] = useState(false);

  return (
    <>
      <div className="animate-fade-up">
        <TransmissaoCard
          ligadorId={ligadorId}
          onMudou={setTransmitindo}
        />
      </div>
      {transmitindo ? (
        children
      ) : (
        <div className="animate-fade-up rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <p className="text-base font-semibold text-white/90">Inicie a transmissão</p>
          <p className="mt-2 text-[13px] text-white/40">
            Compartilhe sua tela inteira e libere o microfone pra ter acesso às fichas.
          </p>
        </div>
      )}
    </>
  );
}
