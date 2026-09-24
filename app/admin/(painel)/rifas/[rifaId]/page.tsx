import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  HourglassMediumIcon,
  TicketIcon,
  UploadSimpleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader, EmptyState } from "@/components/ui/Layout";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Stat, StatusBar, StatusLegenda } from "@/components/ui/Stats";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Th, Tr, Td } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { requireAdminSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCPF, formatNumero, formatRelativo } from "@/lib/format";
import { ehStatus, montarQuery, normalizarBusca, pagina as lerPagina, texto, type SearchParams } from "@/lib/listagem";
import type { FichaLista, RifaLigadorResumo, RifaResumo } from "@/lib/types";
import { DistribuirForm } from "./DistribuirForm";
import { PorLigador } from "./PorLigador";
import { FichasToolbar } from "./FichasToolbar";
import { RevogarButton } from "./RevogarButton";
import { RifaAcoes } from "./RifaAcoes";

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
  const base = `/admin/rifas/${rifaId}`;

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
  const busca = normalizarBusca(q);
  if (busca) consulta = consulta.ilike("busca", `%${busca}%`);

  const de = (pagina - 1) * POR_PAGINA;
  const [{ data: fichas, count, error: erroFichas }, { data: porLigador }, { data: ligadoresAtivos }] =
    await Promise.all([
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

  // offset > total: PostgREST responde 416 (ex.: recolheu as fichas estando na página 3).
  if (erroFichas?.code === "PGRST103") redirect(montarQuery(base, filtros));
  if (erroFichas) throw new Error(`Falha ao carregar fichas: ${erroFichas.message}`);

  const total = count ?? 0;
  const ultimaPagina = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (pagina > ultimaPagina) redirect(montarQuery(base, filtros, { pagina: ultimaPagina }));

  const filaPorLigador = new Map((porLigador ?? []).map((l) => [l.ligador_id, l.pendentes]));
  const opcoesDistribuir = (ligadoresAtivos ?? []).map((l) => ({
    ...l,
    pendentes: filaPorLigador.get(l.id) ?? 0,
  }));
  const temFiltro = Boolean(q || status || ligador);

  const cabecalho = (
    <PageHeader
      eyebrow="Rifa"
      title={rifa.nome}
      description={
        rifa.total === 0
          ? "Nenhuma ficha ainda."
          : `${formatNumero(rifa.total)} fichas de todos os arquivos importados pra esta rifa.`
      }
      back={
        <ButtonLink href="/admin/rifas" variant="ghost" size="sm" icon={<ArrowLeftIcon />}>
          Rifas
        </ButtonLink>
      }
      actions={<RifaAcoes rifaId={rifaId} nome={rifa.nome} vazia={rifa.total === 0} />}
    />
  );

  if (rifa.total === 0) {
    return (
      <div className="flex flex-col gap-8">
        {cabecalho}
        <Card>
          <EmptyState
            icon={<UploadSimpleIcon />}
            title={`Suba o primeiro arquivo pra ${rifa.nome}`}
            description="Tudo que estiver no .txt do checker entra nesta rifa, uma ficha por pessoa. Depois é só distribuir entre os ligadores."
            action={
              <ButtonLink
                href={`/admin/rifas/importar?rifa=${rifaId}`}
                size="lg"
                icon={<UploadSimpleIcon weight="bold" />}
              >
                Importar fichas
              </ButtonLink>
            }
            className="py-20"
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {cabecalho}

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

      <Card className="flex flex-col gap-3 px-5 py-4">
        <StatusBar contagem={rifa} altura="h-2.5" />
        <StatusLegenda contagem={rifa} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <DistribuirForm rifaId={rifaId} disponiveis={rifa.disponiveis} ligadores={opcoesDistribuir} />
        <PorLigador rifaId={rifaId} linhas={porLigador ?? []} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 shrink-0">
            <h2 className="text-[15px] font-medium tracking-tight text-fg">Fichas</h2>
            <p className="mt-0.5 text-[13px] text-fg-subtle">
              {temFiltro ? `${formatNumero(total)} encontrada(s)` : `${formatNumero(total)} no total`}
            </p>
          </div>
          <FichasToolbar ligadores={ligadoresAtivos ?? []} />
        </div>

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
            href={(p) => montarQuery(base, filtros, { pagina: p })}
          />
        )}
      </Card>
    </div>
  );
}
