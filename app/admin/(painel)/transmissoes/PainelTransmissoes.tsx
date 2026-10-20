"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MonitorIcon,
  EyeIcon,
  EyeSlashIcon,
  CircleIcon,
  SpeakerSimpleHighIcon,
  SpeakerSimpleSlashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Layout";
import {
  conectarPainelTransmissoes,
  suportaTransmissao,
} from "@/lib/transmissao";

interface LigadorInfo {
  id: string;
  nome: string;
}

export function PainelTransmissoes({ ligadores }: { ligadores: LigadorInfo[] }) {
  const [suporta] = useState(() => suportaTransmissao());
  const [assistindo, setAssistindo] = useState<string | null>(null);
  const [conectado, setConectado] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const painelRef = useRef<ReturnType<typeof conectarPainelTransmissoes> | null>(null);

  const iniciarPainel = useCallback(() => {
    if (painelRef.current) return painelRef.current;
    const painel = conectarPainelTransmissoes({
      onStream: (stream, _ligadorId) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      },
      onFim: (ligadorId) => {
        if (assistindo === ligadorId) {
          setAssistindo(null);
          if (videoRef.current) videoRef.current.srcObject = null;
        }
      },
      onConexao: (ok) => setConectado(ok),
    });
    painelRef.current = painel;
    return painel;
  }, [assistindo]);

  function assistir(ligadorId: string) {
    const painel = iniciarPainel();
    painel.assistir(ligadorId);
    setAssistindo(ligadorId);
  }

  function sair() {
    painelRef.current?.sair();
    setAssistindo(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => {
    return () => { painelRef.current?.fechar(); };
  }, []);

  function toggleMute() {
    setMuted((m) => {
      if (videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
  }

  if (!suporta) {
    return (
      <Card>
        <EmptyState
          icon={<MonitorIcon />}
          title="Navegador sem suporte"
          description="Seu navegador não suporta WebRTC. Use Chrome ou Edge."
        />
      </Card>
    );
  }

  const ligadorAtual = ligadores.find((l) => l.id === assistindo);

  return (
    <div className="flex flex-col gap-4">
      {/* Video player */}
      {assistindo && (
        <Card className="overflow-hidden">
          <div className="relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={muted}
              className="aspect-video w-full"
            />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                <CircleIcon size={8} weight="fill" className="animate-pulse text-danger" />
                {ligadorAtual?.nome ?? "Ligador"}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex size-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition-colors hover:bg-black/90"
                  aria-label={muted ? "Ativar som" : "Mutar"}
                >
                  {muted ? <SpeakerSimpleSlashIcon size={16} /> : <SpeakerSimpleHighIcon size={16} />}
                </button>
                <button
                  type="button"
                  onClick={sair}
                  className="flex size-8 items-center justify-center rounded-full bg-danger/80 text-white backdrop-blur-sm transition-colors hover:bg-danger"
                  aria-label="Parar de assistir"
                >
                  <EyeSlashIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de ligadores */}
      <Card>
        <CardHeader
          title="Transmissões"
          description={`${ligadores.length} ligador${ligadores.length === 1 ? "" : "es"} — clique pra assistir`}
        />
        {ligadores.length === 0 ? (
          <EmptyState
            icon={<MonitorIcon />}
            title="Nenhum ligador"
            description="Cadastre ligadores pra poder ver as transmissões aqui."
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-line">
            {ligadores.map((lig) => {
              const ativo = lig.id === assistindo;
              return (
                <li key={lig.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <span className="text-sm font-medium text-fg">{lig.nome}</span>
                  <Button
                    size="sm"
                    variant={ativo ? "danger" : "secondary"}
                    onClick={() => (ativo ? sair() : assistir(lig.id))}
                    icon={ativo ? <EyeSlashIcon weight="fill" /> : <EyeIcon weight="fill" />}
                  >
                    {ativo ? "Parar" : "Assistir"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
