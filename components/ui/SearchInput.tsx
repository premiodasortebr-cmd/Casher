"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { Input } from "./Input";
import { useUrlParams } from "./useUrlParams";

/** Campo de busca que grava `?q=` na URL com debounce. */
export function SearchInput({ placeholder = "Buscar…", className }: { placeholder?: string; className?: string }) {
  const { params, set } = useUrlParams();
  const naUrl = params.get("q") ?? "";
  const [valor, setValor] = useState(naUrl);
  const enviado = useRef<string | null>(null);

  // Só espelha a URL quando a mudança veio de fora (aba, paginação, voltar).
  // A confirmação atrasada do nosso próprio replace não pode apagar o que foi digitado depois.
  useEffect(() => {
    if (naUrl === enviado.current) return;
    setValor(naUrl);
  }, [naUrl]);

  useEffect(() => {
    const q = valor.trim();
    if (q === naUrl) return;
    const t = setTimeout(() => {
      enviado.current = q;
      set({ q });
    }, 350);
    return () => clearTimeout(t);
  }, [valor, naUrl, set]);

  return (
    <Input
      type="search"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      placeholder={placeholder}
      icon={<MagnifyingGlassIcon />}
      aria-label={placeholder}
      className={className}
    />
  );
}
