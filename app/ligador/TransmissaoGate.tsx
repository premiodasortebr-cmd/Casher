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
        <div className="animate-fade-up rounded-3xl border border-line bg-surface p-8 text-center">
          <p className="text-lg font-medium text-fg">Inicie a transmissão</p>
          <p className="mt-2 text-sm text-fg-muted">
            Compartilhe sua tela inteira e libere o microfone pra ter acesso às fichas.
          </p>
        </div>
      )}
    </>
  );
}
