"use client";

import { Select } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { useUrlParams } from "@/components/ui/useUrlParams";

export function FichasToolbar({ ligadores }: { ligadores: { id: string; nome: string }[] }) {
  const { params, set } = useUrlParams();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchInput placeholder="Nome, CPF ou telefone" className="sm:w-64" />
      <Select
        aria-label="Status"
        value={params.get("status") ?? ""}
        onChange={(e) => set({ status: e.target.value })}
        className="sm:w-40"
      >
        <option value="">Todos os status</option>
        <option value="pendente">Pendente</option>
        <option value="deu_bom">Deu bom</option>
        <option value="deu_ruim">Deu ruim</option>
      </Select>
      <Select
        aria-label="Ligador"
        value={params.get("ligador") ?? ""}
        onChange={(e) => set({ ligador: e.target.value })}
        className="sm:w-48"
      >
        <option value="">Todos os ligadores</option>
        <option value="sem">Sem ligador</option>
        {ligadores.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nome}
          </option>
        ))}
      </Select>
    </div>
  );
}
