"use client";

import { Select } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { useUrlParams } from "@/components/ui/useUrlParams";

export function FichasToolbar({ ligadores }: { ligadores: { id: string; nome: string }[] }) {
  const { params, set } = useUrlParams();
  // Selects não-controlados com key na URL: a escolha fica na tela enquanto o
  // servidor responde, e remontam com o valor certo quando a URL confirma.
  const chave = params.toString();

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto">
      <SearchInput placeholder="Nome, CPF ou telefone" className="sm:w-64" />
      <Select
        key={`status-${chave}`}
        aria-label="Status"
        defaultValue={params.get("status") ?? ""}
        onChange={(e) => set({ status: e.target.value })}
        className="sm:w-40"
      >
        <option value="">Todos os status</option>
        <option value="pendente">Pendente</option>
        <option value="deu_bom">Deu bom</option>
        <option value="deu_ruim">Deu ruim</option>
      </Select>
      <Select
        key={`ligador-${chave}`}
        aria-label="Ligador"
        defaultValue={params.get("ligador") ?? ""}
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
