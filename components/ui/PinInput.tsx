"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

/**
 * 6 caixas de dígito que se comportam como um campo só: digitar avança, backspace
 * volta, colar "123456" preenche tudo. O valor vai num <input hidden name={name}>
 * pra funcionar direto com <form action>. `onComplete` dispara ao preencher o 6º.
 */
export function PinInput({
  name,
  length = 6,
  autoFocus,
  invalid,
  disabled,
  onComplete,
}: {
  name: string;
  length?: number;
  autoFocus?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  onComplete?: (valor: string) => void;
}) {
  const [digitos, setDigitos] = useState<string[]>(() => Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function atualizar(novos: string[]) {
    setDigitos(novos);
    if (novos.every((d) => d !== "")) onComplete?.(novos.join(""));
  }

  function aoDigitar(i: number, valor: string) {
    const d = valor.replace(/\D/g, "");
    if (!d) return;
    // Autofill/teclado às vezes entrega mais de um dígito de uma vez.
    const novos = [...digitos];
    for (let k = 0; k < d.length && i + k < length; k++) novos[i + k] = d[k];
    atualizar(novos);
    refs.current[Math.min(i + d.length, length - 1)]?.focus();
  }

  function aoTeclar(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const novos = [...digitos];
      if (novos[i]) {
        novos[i] = "";
        setDigitos(novos);
      } else if (i > 0) {
        novos[i - 1] = "";
        setDigitos(novos);
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  function aoColar(e: ClipboardEvent<HTMLInputElement>) {
    const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!d) return;
    e.preventDefault();
    const novos = Array(length).fill("");
    for (let k = 0; k < d.length; k++) novos[k] = d[k];
    atualizar(novos);
    refs.current[Math.min(d.length, length - 1)]?.focus();
  }

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-2.5">
      <input type="hidden" name={name} value={digitos.join("")} />
      {digitos.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="password"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Dígito ${i + 1} de ${length}`}
          aria-invalid={invalid || undefined}
          maxLength={length}
          value={d}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => aoDigitar(i, e.target.value)}
          onKeyDown={(e) => aoTeclar(i, e)}
          onPaste={aoColar}
          onFocus={(e) => e.target.select()}
          className={`h-14 w-full min-w-0 rounded-xl border bg-surface-2 text-center font-mono text-2xl text-fg caret-accent shadow-[inset_0_1px_2px_0_rgb(0_0_0/0.35)] outline-none transition-[border-color,box-shadow,background-color,transform] duration-300 ease-spring focus:scale-[1.04] focus:border-accent/70 focus:bg-surface-3 focus:shadow-[0_0_0_4px_rgb(200_238_114/0.12)] disabled:opacity-50 sm:h-16 ${
            invalid ? "border-danger/60" : d ? "border-white/25" : "border-line-strong"
          }`}
        />
      ))}
    </div>
  );
}
