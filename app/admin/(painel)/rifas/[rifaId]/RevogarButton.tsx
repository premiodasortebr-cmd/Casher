"use client";

import { useTransition } from "react";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { IconButton } from "@/components/ui/Button";
import { revogarAcesso } from "./actions";

export function RevogarButton({ rifaId, ligadorId, fichaId }: { rifaId: string; ligadorId: string; fichaId: string }) {
  const [pendente, startTransition] = useTransition();
  return (
    <IconButton
      aria-label="Tirar do ligador"
      title="Tirar do ligador"
      disabled={pendente}
      onClick={() => startTransition(() => revogarAcesso(rifaId, ligadorId, fichaId))}
      className="hover:bg-danger/15 hover:text-danger"
    >
      <XIcon size={14} weight="bold" />
    </IconButton>
  );
}
