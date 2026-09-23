-- Distribuição em lote + listagem paginada/filtrável.
--
-- Regra: uma ficha fica com um ligador por vez. "Disponível" = pendente e sem
-- nenhum acesso. O admin escolhe rifa + ligador + quantidade, e o banco pega as
-- N mais antigas disponíveis numa transação só.

-- `disponiveis` entra no fim (create or replace view só aceita coluna nova no final).
create or replace view public.rifas_resumo
with (security_invoker = true) as
select
  r.id,
  r.nome,
  r.premio_descricao,
  r.premio_valor,
  r.data_sorteio,
  r.created_at,
  count(f.id)::int as total,
  count(f.id) filter (where f.status = 'pendente')::int as pendente,
  count(f.id) filter (where f.status = 'deu_bom')::int as deu_bom,
  count(f.id) filter (where f.status = 'deu_ruim')::int as deu_ruim,
  count(f.id) filter (
    where not exists (select 1 from public.ligador_acesso la where la.ficha_id = f.id)
  )::int as sem_ligador,
  count(f.id) filter (
    where f.status = 'pendente'
      and not exists (select 1 from public.ligador_acesso la where la.ficha_id = f.id)
  )::int as disponiveis
from public.rifas r
left join public.fichas f on f.rifa_id = r.id
group by r.id;

-- Ficha + ligador atual (o primeiro acesso, se houver): filtrar por "sem ligador"
-- vira um `ligador_id is null`, sem N+1 nem lista gigante de ids na URL.
create or replace view public.fichas_lista
with (security_invoker = true) as
select
  f.id,
  f.rifa_id,
  f.cpf,
  f.nome,
  f.telefone,
  f.status,
  f.observacao,
  f.status_atualizado_em,
  f.created_at,
  la.ligador_id,
  l.nome as ligador_nome
from public.fichas f
left join lateral (
  select a.ligador_id
  from public.ligador_acesso a
  where a.ficha_id = f.id
  order by a.created_at
  limit 1
) la on true
left join public.ligadores l on l.id = la.ligador_id;

-- Fila de cada ligador dentro de cada rifa.
create or replace view public.rifa_ligadores_resumo
with (security_invoker = true) as
select
  f.rifa_id,
  l.id as ligador_id,
  l.nome,
  l.foto_url,
  l.ativo,
  count(a.id)::int as atribuidas,
  count(a.id) filter (where f.status = 'pendente')::int as pendentes,
  count(a.id) filter (where f.status = 'deu_bom')::int as deu_bom,
  count(a.id) filter (where f.status = 'deu_ruim')::int as deu_ruim
from public.ligador_acesso a
join public.fichas f on f.id = a.ficha_id
join public.ligadores l on l.id = a.ligador_id
group by f.rifa_id, l.id;

-- `skip locked`: dois admins distribuindo ao mesmo tempo nunca pegam a mesma ficha.
create or replace function public.distribuir_fichas(
  p_rifa_id uuid,
  p_ligador_id uuid,
  p_quantidade int
)
returns int
language plpgsql
as $$
declare
  v_qtd int;
begin
  with escolhidas as (
    select f.id
    from public.fichas f
    where f.rifa_id = p_rifa_id
      and f.status = 'pendente'
      and not exists (select 1 from public.ligador_acesso la where la.ficha_id = f.id)
    order by f.created_at, f.nome
    limit greatest(p_quantidade, 0)
    for update of f skip locked
  ),
  inseridas as (
    insert into public.ligador_acesso (ligador_id, ficha_id)
    select p_ligador_id, id from escolhidas
    returning 1
  )
  select count(*) into v_qtd from inseridas;
  return v_qtd;
end
$$;

-- Devolve pro pool as pendentes de um ligador nessa rifa. As já marcadas ficam
-- com ele (histórico de quem ligou).
create or replace function public.recolher_pendentes(p_rifa_id uuid, p_ligador_id uuid)
returns int
language plpgsql
as $$
declare
  v_qtd int;
begin
  with removidas as (
    delete from public.ligador_acesso a
    using public.fichas f
    where a.ficha_id = f.id
      and a.ligador_id = p_ligador_id
      and f.rifa_id = p_rifa_id
      and f.status = 'pendente'
    returning 1
  )
  select count(*) into v_qtd from removidas;
  return v_qtd;
end
$$;

revoke all on public.fichas_lista from anon, authenticated;
revoke all on public.rifa_ligadores_resumo from anon, authenticated;
revoke all on function public.distribuir_fichas(uuid, uuid, int) from public, anon, authenticated;
revoke all on function public.recolher_pendentes(uuid, uuid) from public, anon, authenticated;
