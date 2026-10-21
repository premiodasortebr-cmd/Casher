/**
 * Transmissão de tela (WebRTC) ligador → admin.
 * Sinalização via Supabase Realtime broadcast (canal por ligador).
 * Vídeo e áudio vão direto entre os navegadores (peer-to-peer).
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase/client";

const ICE: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

export const suportaTransmissao = () =>
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getDisplayMedia &&
  typeof RTCPeerConnection !== "undefined";

function criarPeer(onCandidato: (c: RTCIceCandidate) => void) {
  const pc = new RTCPeerConnection({ iceServers: ICE });
  const fila: RTCIceCandidateInit[] = [];
  pc.onicecandidate = (e) => {
    if (e.candidate) onCandidato(e.candidate);
  };
  return {
    pc,
    async remota(desc: RTCSessionDescriptionInit) {
      await pc.setRemoteDescription(desc);
      while (fila.length) await pc.addIceCandidate(fila.shift()!).catch(() => {});
    },
    async candidato(c: RTCIceCandidateInit) {
      if (pc.remoteDescription) await pc.addIceCandidate(c).catch(() => {});
      else fila.push(c);
    },
  };
}

function nomeCanal(ligadorId: string) {
  return `transmissao:${ligadorId}`;
}

const CANAL_ONLINE = "transmissoes-online";

const ATRASO_VOZ_MS = 1200;

function tocarAvisoAdmin() {
  try {
    const ctx = new AudioContext();
    [784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.22;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch { /* sem áudio */ }
}

function tocarAudioRemoto(e: RTCTrackEvent, el: { current: HTMLAudioElement | null }) {
  if (e.track.kind !== "audio") return;
  if (!el.current) el.current = new Audio();
  el.current.srcObject = new MediaStream([e.track]);
  el.current.play().catch(() => {});
}

// ---------------------------------------------------------------------------
// LIGADOR: captura tela inteira + áudio do sistema + microfone (misturados).
// ---------------------------------------------------------------------------

export async function iniciarTransmissaoLigador({
  ligadorId,
  onFim,
  onConexao,
  onAdminFalando,
}: {
  ligadorId: string;
  onFim?: () => void;
  onConexao?: (ok: boolean) => void;
  onAdminFalando?: (falando: boolean) => void;
}) {
  const tela = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: "monitor" as any, frameRate: { ideal: 15, max: 20 } },
    audio: true,
    systemAudio: "include",
    selfBrowserSurface: "exclude",
    preferCurrentTab: false,
    monitorTypeSurfaces: "include",
    surfaceSwitching: "exclude",
  } as any);

  const video = tela.getVideoTracks()[0];
  const superficie = (video?.getSettings?.() as any).displaySurface;
  const ehTelaInteira = superficie
    ? superficie === "monitor"
    : /^screen:/i.test(video?.label || "");

  if (!ehTelaInteira) {
    tela.getTracks().forEach((t) => t.stop());
    throw new Error('Escolha "Tela inteira" ao compartilhar (não vale só uma janela ou aba).');
  }
  if (!tela.getAudioTracks().length) {
    tela.getTracks().forEach((t) => t.stop());
    throw new Error('Deixe ligado "Compartilhar com áudio do sistema" ao compartilhar a tela.');
  }

  let mic: MediaStream | null = null;
  try {
    mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch {
    mic = null;
  }
  if (!mic?.getAudioTracks().length) {
    tela.getTracks().forEach((t) => t.stop());
    throw new Error(
      "Libere o microfone pra transmitir. Clique no cadeado ao lado do endereço do site → Microfone → Permitir, e tente de novo.",
    );
  }

  const fontes = [...tela.getAudioTracks(), ...mic.getAudioTracks()];
  let ctx: AudioContext | null = null;
  let audio: MediaStreamTrack | null = null;
  if (fontes.length) {
    ctx = new AudioContext();
    ctx.resume().catch(() => {});
    const destino = ctx.createMediaStreamDestination();
    for (const t of fontes)
      ctx.createMediaStreamSource(new MediaStream([t])).connect(destino);
    audio = destino.stream.getAudioTracks()[0];
  }
  const saida = new MediaStream([video, ...(audio ? [audio] : [])]);

  const peers = new Map<string, ReturnType<typeof criarPeer>>();
  const fecharPeer = (id: string) => {
    peers.get(id)?.pc.close();
    peers.delete(id);
  };

  const supabase = getSupabaseClient();
  const canal = supabase.channel(nomeCanal(ligadorId), {
    config: { broadcast: { self: false } },
  });
  const online = supabase.channel(CANAL_ONLINE, { config: { presence: { key: ligadorId } } });
  online.subscribe((s) => {
    if (s === "SUBSCRIBED") online.track({ ligadorId, desde: Date.now() });
  });
  const audioAdmin: { current: HTMLAudioElement | null } = { current: null };

  canal
    .on("broadcast", { event: "admin-mic" }, ({ payload }) => {
      if (payload.falando) tocarAvisoAdmin();
      onAdminFalando?.(!!payload.falando);
    })
    .on("broadcast", { event: "viewer-join" }, async ({ payload }) => {
      const viewerId = payload.viewerId as string;
      fecharPeer(viewerId);
      const peer = criarPeer((c) =>
        canal.send({
          type: "broadcast",
          event: "signal",
          payload: { to: viewerId, from: ligadorId, data: { candidate: c } },
        }),
      );
      peer.pc.ontrack = (e) => tocarAudioRemoto(e, audioAdmin);
      peers.set(viewerId, peer);
      saida.getTracks().forEach((t) => peer.pc.addTrack(t, saida));
      const oferta = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(oferta);
      canal.send({
        type: "broadcast",
        event: "signal",
        payload: {
          to: viewerId,
          from: ligadorId,
          data: { sdp: peer.pc.localDescription },
        },
      });
    })
    .on("broadcast", { event: "viewer-leave" }, ({ payload }) => {
      fecharPeer(payload.viewerId as string);
    })
    .on("broadcast", { event: "signal" }, async ({ payload }) => {
      if (payload.to !== ligadorId) return;
      const peer = peers.get(payload.from as string);
      if (!peer) return;
      if (payload.data?.sdp) await peer.remota(payload.data.sdp);
      else if (payload.data?.candidate) await peer.candidato(payload.data.candidate);
    })
    .subscribe((status) => {
      onConexao?.(status === "SUBSCRIBED");
      if (status === "SUBSCRIBED") {
        canal.send({
          type: "broadcast",
          event: "status",
          payload: { ligadorId, transmitindo: true },
        });
      }
    });

  let parado = false;
  const parar = () => {
    if (parado) return;
    parado = true;
    canal.send({
      type: "broadcast",
      event: "status",
      payload: { ligadorId, transmitindo: false },
    });
    for (const id of [...peers.keys()]) fecharPeer(id);
    supabase.removeChannel(canal);
    online.untrack().finally(() => supabase.removeChannel(online));
    if (audioAdmin.current) audioAdmin.current.srcObject = null;
    onAdminFalando?.(false);
    tela.getTracks().forEach((t) => t.stop());
    mic?.getTracks().forEach((t) => t.stop());
    ctx?.close().catch(() => {});
    onFim?.();
  };

  video.addEventListener("ended", parar);
  mic.getAudioTracks().forEach((t) => t.addEventListener("ended", parar));

  return { parar };
}

// ---------------------------------------------------------------------------
// ADMIN: assiste um ligador por vez.
// ---------------------------------------------------------------------------

export type EstadoConexao = "conectando" | "ao-vivo" | "caiu";

export function conectarPainelTransmissoes({
  onStream,
  onFim,
  onConexao,
  onOnline,
  onEstado,
}: {
  onStream: (stream: MediaStream, ligadorId: string) => void;
  onFim?: (ligadorId: string) => void;
  onConexao?: (ok: boolean) => void;
  onOnline?: (ids: string[]) => void;
  onEstado?: (estado: EstadoConexao) => void;
}) {
  let canalAtual: RealtimeChannel | null = null;
  let assistindo: string | null = null;
  let peer: ReturnType<typeof criarPeer> | null = null;
  let mic: MediaStreamTrack | null = null;
  let falandoTimer: ReturnType<typeof setTimeout> | null = null;
  const supabase = getSupabaseClient();
  const viewerId = `v_${crypto.randomUUID().slice(0, 8)}`;

  const online = supabase.channel(CANAL_ONLINE);
  online
    .on("presence", { event: "sync" }, () => onOnline?.(Object.keys(online.presenceState())))
    .subscribe();

  const senderAudio = () =>
    peer?.pc.getTransceivers().find((t) => t.receiver.track.kind === "audio")?.sender ?? null;

  const encerrar = () => {
    peer?.pc.close();
    peer = null;
  };

  const pedirStream = () => {
    canalAtual?.send({ type: "broadcast", event: "viewer-join", payload: { viewerId } });
  };

  function assistir(ligadorId: string) {
    if (assistindo) sair();
    assistindo = ligadorId;
    onEstado?.("conectando");
    canalAtual = supabase.channel(nomeCanal(ligadorId), {
      config: { broadcast: { self: false } },
    });

    canalAtual
      .on("broadcast", { event: "signal" }, async ({ payload }) => {
        if (payload.to !== viewerId) return;
        if (payload.data?.sdp) {
          encerrar();
          const alvo = assistindo!;
          const novo = criarPeer((c) =>
            canalAtual!.send({
              type: "broadcast",
              event: "signal",
              payload: { to: alvo, from: viewerId, data: { candidate: c } },
            }),
          );
          peer = novo;
          novo.pc.ontrack = (e) => onStream(e.streams[0] || new MediaStream([e.track]), alvo);
          novo.pc.onconnectionstatechange = () => {
            const st = novo.pc.connectionState;
            if (st === "connected") onEstado?.("ao-vivo");
            else if (st === "failed" || st === "disconnected") onEstado?.("caiu");
          };
          await novo.remota(payload.data.sdp);
          const tr = novo.pc.getTransceivers().find((t) => t.receiver.track.kind === "audio");
          if (tr) {
            tr.direction = "sendrecv";
            if (mic) await tr.sender.replaceTrack(mic);
          }
          const resposta = await novo.pc.createAnswer();
          await novo.pc.setLocalDescription(resposta);
          canalAtual!.send({
            type: "broadcast",
            event: "signal",
            payload: { to: alvo, from: viewerId, data: { sdp: novo.pc.localDescription } },
          });
        } else if (payload.data?.candidate && peer) {
          await peer.candidato(payload.data.candidate);
        }
      })
      .on("broadcast", { event: "status" }, ({ payload }) => {
        if (payload.ligadorId !== assistindo) return;
        if (payload.transmitindo) {
          onEstado?.("conectando");
          pedirStream();
        } else {
          encerrar();
          onFim?.(payload.ligadorId);
        }
      })
      .subscribe((status) => {
        onConexao?.(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") pedirStream();
      });
  }

  async function falar(ligar: boolean) {
    if (falandoTimer) clearTimeout(falandoTimer);
    if (ligar) {
      if (!mic) {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        mic = s.getAudioTracks()[0];
      }
      canalAtual?.send({ type: "broadcast", event: "admin-mic", payload: { falando: true } });
      const track = mic;
      falandoTimer = setTimeout(() => { senderAudio()?.replaceTrack(track).catch(() => {}); }, ATRASO_VOZ_MS);
    } else {
      await senderAudio()?.replaceTrack(null).catch(() => {});
      mic?.stop();
      mic = null;
      canalAtual?.send({ type: "broadcast", event: "admin-mic", payload: { falando: false } });
    }
  }

  function sair() {
    if (mic) void falar(false);
    if (canalAtual && assistindo) {
      canalAtual.send({ type: "broadcast", event: "viewer-leave", payload: { viewerId } });
      supabase.removeChannel(canalAtual);
      canalAtual = null;
    }
    encerrar();
    assistindo = null;
  }

  function fechar() {
    sair();
    supabase.removeChannel(online);
  }

  return { assistir, sair, fechar, falar, reconectar: pedirStream };
}
