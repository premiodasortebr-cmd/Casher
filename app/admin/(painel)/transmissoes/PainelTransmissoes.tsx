"use client";

import { useEffect, useRef, useState } from "react";
import {
  MonitorIcon,
  CircleIcon,
  SpeakerSimpleHighIcon,
  SpeakerSimpleSlashIcon,
  CornersOutIcon,
  XIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  ArrowClockwiseIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Layout";
import {
  conectarPainelTransmissoes,
  suportaTransmissao,
  type EstadoConexao,
} from "@/lib/transmissao";

interface LigadorInfo {
  id: string;
  nome: string;
}

export function PainelTransmissoes({ ligadores }: { ligadores: LigadorInfo[] }) {
  const [suporta] = useState(() => suportaTransmissao());
  const [assistindo, setAssistindo] = useState<string | null>(null);
  const [online, setOnline] = useState<string[]>([]);
  const [estado, setEstado] = useState<EstadoConexao | "encerrou">("conectando");
  const [muted, setMuted] = useState(false);
  const [falando, setFalando] = useState(false);
  const [erroMic, setErroMic] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const painelRef = useRef<ReturnType<typeof conectarPainelTransmissoes> | null>(null);

  useEffect(() => {
    if (!suporta) return;
    const painel = conectarPainelTransmissoes({
      onStream: (stream) => {
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        v.play().catch(() => {
          v.muted = true;
          setMuted(true);
          v.play().catch(() => {});
        });
      },
      onFim: () => {
        setEstado("encerrou");
        setFalando(false);
        if (videoRef.current) videoRef.current.srcObject = null;
      },
      onOnline: setOnline,
      onEstado: setEstado,
    });
    painelRef.current = painel;
    return () => painel.fechar();
  }, [suporta]);

  function assistir(id: string) {
    if (id === assistindo) return;
    setFalando(false);
    setErroMic(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setAssistindo(id);
    painelRef.current?.assistir(id);
  }

  function sair() {
    painelRef.current?.sair();
    setAssistindo(null);
    setFalando(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function alternarFala() {
    setErroMic(null);
    try {
      await painelRef.current?.falar(!falando);
      setFalando(!falando);
    } catch {
      setErroMic("Libere o microfone no navegador pra falar com o ligador.");
    }
  }

  function alternarSom() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function telaCheia() {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen().catch(() => {});
  }

  if (!suporta) {
    return (
      <Card>
        <EmptyState icon={<MonitorIcon />} title="Navegador sem suporte" description="Use Chrome ou Edge." />
      </Card>
    );
  }

  const ordenados = [...ligadores].sort(
    (a, b) => Number(online.includes(b.id)) - Number(online.includes(a.id)) || a.nome.localeCompare(b.nome),
  );
  const atual = ligadores.find((l) => l.id === assistindo);
  const atualOnline = !!assistindo && online.includes(assistindo);
  const aoVivo = estado === "ao-vivo";

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit overflow-hidden">
        <div className="border-b border-line px-4 py-3.5">
          <p className="text-[14px] font-semibold text-fg">Ligadores</p>
          <p className="mt-0.5 text-[12.5px] text-fg-subtle">
            <span className="text-accent">{online.length} transmitindo</span> · {ligadores.length} no total
          </p>
        </div>
        {ligadores.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-fg-subtle">Nenhum ligador cadastrado.</p>
        ) : (
          <ul className="max-h-[70vh] overflow-y-auto p-2">
            {ordenados.map((lig) => {
              const on = online.includes(lig.id);
              const sel = lig.id === assistindo;
              return (
                <li key={lig.id}>
                  <button
                    type="button"
                    onClick={() => assistir(lig.id)}
                    disabled={!on && !sel}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      sel ? "bg-accent/15 ring-1 ring-accent/40" : on ? "hover:bg-white/[0.05]" : "cursor-not-allowed opacity-45"
                    }`}
                  >
                    <span className="relative flex size-2.5 shrink-0">
                      {on && <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger/60" />}
                      <span className={`relative inline-flex size-2.5 rounded-full ${on ? "bg-danger" : "bg-white/20"}`} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-fg">{lig.nome}</span>
                    <span className={`text-[11px] font-medium ${on ? "text-danger" : "text-fg-subtle"}`}>
                      {on ? "AO VIVO" : "offline"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div ref={playerRef} className="relative flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-line bg-black">
        <video ref={videoRef} autoPlay playsInline muted={muted} className={`h-full w-full flex-1 object-contain ${assistindo && aoVivo ? "" : "hidden"}`} />

        {(!assistindo || !aoVivo) && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.05] text-fg-subtle">
              <MonitorIcon size={28} />
            </div>
            {!assistindo ? (
              <>
                <p className="text-[15px] font-semibold text-fg">Escolha um ligador ao vivo</p>
                <p className="max-w-sm text-[13px] text-fg-subtle">
                  Quem está com o ponto vermelho piscando está transmitindo agora. Clique pra assistir.
                </p>
              </>
            ) : estado === "encerrou" || !atualOnline ? (
              <>
                <p className="text-[15px] font-semibold text-fg">{atual?.nome} parou de transmitir</p>
                <p className="text-[13px] text-fg-subtle">Quando ele voltar, a imagem aparece aqui sozinha.</p>
              </>
            ) : estado === "caiu" ? (
              <>
                <p className="text-[15px] font-semibold text-fg">A conexão caiu</p>
                <button
                  type="button"
                  onClick={() => { setEstado("conectando"); painelRef.current?.reconectar(); }}
                  className="mt-1 inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-[13px] font-semibold text-accent-fg"
                >
                  <ArrowClockwiseIcon size={15} weight="bold" /> Reconectar
                </button>
              </>
            ) : (
              <>
                <div className="size-6 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
                <p className="text-[13px] text-fg-subtle">Conectando com {atual?.nome}…</p>
              </>
            )}
          </div>
        )}

        {assistindo && (
          <>
            <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-3">
              <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[12.5px] font-medium text-white backdrop-blur-sm">
                <CircleIcon size={8} weight="fill" className={aoVivo ? "animate-pulse text-danger" : "text-white/40"} />
                {atual?.nome}
                {aoVivo && <span className="text-danger">· AO VIVO</span>}
              </div>
              <button
                type="button"
                onClick={sair}
                aria-label="Fechar"
                className="flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-2 bg-gradient-to-t from-black/85 to-transparent p-4">
              <button
                type="button"
                onClick={alternarFala}
                disabled={!aoVivo}
                className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13.5px] font-semibold transition-all active:scale-95 disabled:opacity-40 ${
                  falando ? "bg-danger text-white shadow-[0_0_24px_-4px_rgb(241_120_125/0.8)]" : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {falando ? <MicrophoneIcon size={18} weight="fill" className="animate-pulse" /> : <MicrophoneSlashIcon size={18} weight="fill" />}
                {falando ? "Falando com o ligador — clique pra parar" : "Falar com o ligador"}
              </button>
              <button
                type="button"
                onClick={alternarSom}
                aria-label={muted ? "Ativar som" : "Mutar"}
                className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
              >
                {muted ? <SpeakerSimpleSlashIcon size={18} /> : <SpeakerSimpleHighIcon size={18} />}
              </button>
              <button
                type="button"
                onClick={telaCheia}
                aria-label="Tela cheia"
                className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
              >
                <CornersOutIcon size={18} />
              </button>
            </div>
            {erroMic && (
              <p className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-danger/90 px-4 py-1.5 text-[12.5px] text-white">{erroMic}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
