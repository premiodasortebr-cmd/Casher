"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MonitorIcon,
  StopIcon,
  CircleIcon,
  WifiHighIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
    <Card>
      <CardHeader
        title="Transmissão de tela"
        description={
          transmitindo ? (
            <span className="flex items-center gap-1.5">
              {conectado ? (
                <WifiHighIcon size={14} weight="fill" className="text-accent" />
              ) : (
                <WifiSlashIcon size={14} weight="fill" className="text-warning" />
              )}
              <CircleIcon size={8} weight="fill" className="animate-pulse text-danger" />
              Transmitindo...
            </span>
          ) : (
            "Compartilhe sua tela para o admin acompanhar"
          )
        }
      />
      <div className="p-5">
        {erro && (
          <p className="mb-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">{erro}</p>
        )}
        {transmitindo ? (
          <Button
            variant="danger"
            block
            onClick={parar}
            icon={<StopIcon weight="fill" />}
          >
            Parar transmissão
          </Button>
        ) : (
          <Button
            block
            onClick={iniciar}
            icon={<MonitorIcon weight="fill" />}
          >
            Iniciar transmissão
          </Button>
        )}
      </div>
    </Card>
  );
}
