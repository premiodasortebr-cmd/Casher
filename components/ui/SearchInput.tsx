"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { Input } from "./Input";
import { useUrlParams } from "./useUrlParams";

/** Campo de busca que grava `?q=` na URL com debounce. */
export function SearchInput({ placeholder = "Buscar…", className }: { placeholder?: string; className?: string }) {
  const { params, set } = useUrlParams();
  const naUrl = params.get("q") ?? "";
  const [valor, setValor] = useState(naUrl);

  useEffect(() => {
    setValor(naUrl);
  }, [naUrl]);

  useEffect(() => {
    if (valor === naUrl) return;
    const t = setTimeout(() => set({ q: valor.trim() }), 350);
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
