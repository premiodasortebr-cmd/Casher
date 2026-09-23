import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  HourglassMediumIcon,
  TicketIcon,
  TrophyIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader, EmptyState } from "@/components/ui/Layout";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Stat, StatusBar, StatusLegenda } from "@/components/ui/Stats";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Th, Tr, Td } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL, formatCPF, formatDataHora, formatNumero, formatRelativo } from "@/lib/format";
import { ehStatus, montarQuery, pagina as lerPagina, sanitizarBusca, texto, type SearchParams } from "@/lib/listagem";
import type { FichaLista, RifaLigadorResumo, RifaResumo } from "@/lib/types";
import { DistribuirForm } from "./DistribuirForm";
import { PorLigador } from "./PorLigador";
import { FichasToolbar } from "./FichasToolbar";
import { RevogarButton } from "./RevogarButton";

const POR_PAGINA = 50;

export default async function RifaDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ rifaId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminSession();
  const [{ rifaId }, sp] = await Promise.all([params, searchParams]);

  const q = texto(sp, "q");
  const statusBruto = texto(sp, "status");
  const status = ehStatus(statusBruto) ? statusBruto : "";
  const ligador = texto(sp, "ligador");
  const pagina = lerPagina(sp);
  const filtros = { q, status, ligador };

  const supabase = createAdminClient();

  const { data: rifa } = await supabase
    .from("rifas_resumo")
    .select("*")
    .eq("id", rifaId)
    .maybeSingle<RifaResumo>();
  if (!rifa) notFound();

  let consulta = supabase.from("fichas_lista").select("*", { count: "exact" }).eq("rifa_id", rifaId);
  if (status) consulta = consulta.eq("status", status);
  if (ligador === "sem") consulta = consulta.is("ligador_id", null);
  else if (ligador) consulta = consulta.eq("ligador_id", ligador);
  const busca = sanitizarBusca(q);
  if (busca) consulta = consulta.or(`nome.ilike.%${busca}%,cpf.ilike.%${busca}%,telefone.ilike.%${busca}%`);

  const de = (pagina - 1) * POR_PAGINA;
  const [{ data: fichas, count }, { data: porLigador }, { data: ligadoresAtivos }] = await Promise.all([
    consulta.order("nome").range(de, de + POR_PAGINA - 1).returns<FichaLista[]>(),
    supabase
      .from("rifa_ligadores_resumo")
      .select("*")
      .eq("rifa_id", rifaId)
      .order("pendentes", { ascending: false })
      .returns<RifaLigadorResumo[]>(),
    supabase
      .from("ligadores")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")
      .returns<{ id: string; nome: string }[]>(),
  ]);

  const total = count ?? 0;
  const filaPorLigador = new Map((porLigador ?? []).map((l) => [l.ligador_id, l.pendentes]));
  const opcoesDistribuir = (ligadoresAtivos ?? []).map((l) => ({
    ...l,
    pendentes: filaPorLigador.get(l.id) ?? 0,
  }));
  const temFiltro = Boolean(q || status || ligador);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Rifa"
        title={rifa.nome}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {rifa.premio_descricao && (
              <span className="inline-flex items-center gap-1.5">
                <TrophyIcon size={15} className="text-fg-subtle" />
                {rifa.premio_descricao}
              </span>
            )}
            {rifa.premio_valor != null && <span>{formatBRL(rifa.premio_valor)}</span>}
            {rifa.data_sorteio && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon size={15} className="text-fg-subtle" />
                {formatDataHora(rifa.data_sorteio)}
              </span>
            )}
          </span>
        }
        back={
          <ButtonLink href="/admin/rifas" variant="ghost" size="sm" icon={<ArrowLeftIcon />}>
            Rifas
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Fichas" value={formatNumero(rifa.total)} icon={<TicketIcon />} />
        <Stat
          label="Disponíveis"
          value={formatNumero(rifa.disponiveis)}
          icon={<UsersThreeIcon />}
          tom="accent"
          footer="pendentes e sem ligador"
        />
        <Stat
          label="Na fila"
          value={formatNumero(rifa.pendente - rifa.disponiveis)}
          icon={<HourglassMediumIcon />}
          tom="warning"
          footer="com ligador, ainda não ligadas"
        />
        <Stat
          label="Deu bom"
          value={formatNumero(rifa.deu_bom)}
          icon={<CheckCircleIcon />}
          footer={`${formatNumero(rifa.deu_ruim)} deu ruim`}
        />
      </div>

      {rifa.total > 0 && (
        <Card className="flex flex-col gap-3 px-5 py-4">
          <StatusBar contagem={rifa} altura="h-2.5" />
          <StatusLegenda contagem={rifa} />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <DistribuirForm rifaId={rifaId} disponiveis={rifa.disponiveis} ligadores={opcoesDistribuir} />
        <PorLigador rifaId={rifaId} linhas={porLigador ?? []} />
      </div>

      <Card>
        <CardHeader
          title="Fichas"
          description={temFiltro ? `${formatNumero(total)} encontrada(s)` : `${formatNumero(total)} no total`}
          actions={<FichasToolbar ligadores={ligadoresAtivos ?? []} />}
          className="flex-col items-stretch gap-3 md:flex-row md:items-start"
        />

        {(fichas ?? []).length === 0 ? (
          <EmptyState
            icon={<TicketIcon />}
            title={temFiltro ? "Nada com esses filtros" : "Nenhuma ficha nessa rifa"}
            description={temFiltro ? "Tenta limpar a busca ou trocar o status." : "Importe o .txt do checker pra popular."}
            className="py-12"
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Telefone</Th>
                <Th>Ligador</Th>
                <Th>Status</Th>
                <Th>Atualizado</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {(fichas ?? []).map((f) => (
                <Tr key={f.id}>
                  <Td>
                    <p className="font-medium text-fg">{f.nome}</p>
                    <p className="font-mono text-[12px] tabular-nums text-fg-subtle">{formatCPF(f.cpf)}</p>
                  </Td>
                  <Td className="whitespace-nowrap font-mono text-[13px] tabular-nums text-fg-muted">
                    {f.telefone ?? "—"}
                  </Td>
                  <Td>
                    {f.ligador_nome ? (
                      <span className="inline-flex items-center gap-2 text-fg">
                        <Avatar nome={f.ligador_nome} size="sm" />
                        <span className="truncate">{f.ligador_nome}</span>
                      </span>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={f.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-[12.5px] text-fg-subtle">
                    {f.status_atualizado_em ? formatRelativo(f.status_atualizado_em) : "—"}
                  </Td>
                  <Td className="text-right">
                    {f.ligador_id && <RevogarButton rifaId={rifaId} ligadorId={f.ligador_id} fichaId={f.id} />}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}

        {total > POR_PAGINA && (
          <Pagination
            pagina={pagina}
            porPagina={POR_PAGINA}
            total={total}
            href={(p) => montarQuery(filtros, { pagina: p })}
          />
        )}
      </Card>
    </div>
  );
}
