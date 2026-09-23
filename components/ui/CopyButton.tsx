"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react/dist/ssr";

export function CopyButton({
  valor,
  label = "Copiar",
  className,
}: {
  valor: string;
  label?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      // Clipboard bloqueado (http sem TLS / permissão negada) — nada a fazer além de não quebrar.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={copiado ? "Copiado" : label}
      title={copiado ? "Copiado" : label}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-300 ease-spring active:scale-90 ${
        copiado ? "bg-accent-soft text-accent" : "text-fg-subtle hover:bg-white/[0.06] hover:text-fg"
      } ${className ?? ""}`}
    >
      {copiado ? <CheckIcon size={16} weight="bold" /> : <CopyIcon size={16} />}
    </button>
  );
}
