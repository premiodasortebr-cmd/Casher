-- Status "retornar": a pessoa não atendeu, o ligador vai tentar de novo. Continua
-- na fila dele (não volta pro pool e não conta como resolvida).
--
-- "Pendente" nas views passa a ser "ainda não resolvida" (pendente OU retornar).
-- Escrito como `status not in ('deu_bom','deu_ruim')` de propósito: o valor novo
-- do enum não pode ser usado na mesma transação em que foi criado.

alter type public.ficha_status add value if not exists 'retornar';

drop view if exists public.rifas_resumo;
create view public.rifas_resumo
with (security_invoker = true) as
select
  r.id,
  r.nome,
  r.created_at,
  count(f.id)::int as total,
  count(f.id) filter (where f.status not in ('deu_bom', 'deu_ruim'))::int as pendente,
  count(f.id) filter (where f.status = 'deu_bom')::int as deu_bom,
  count(f.id) filter (where f.status = 'deu_ruim')::int as deu_ruim,
  count(f.id) filter (
    where not exists (select 1 from public.ligador_acesso la where la.ficha_id = f.id)
  )::int as sem_ligador,
  count(f.id) filter (
    where f.status not in ('deu_bom', 'deu_ruim')
      and not exists (select 1 from public.ligador_acesso la where la.ficha_id = f.id)
  )::int as disponiveis
from public.rifas r
left join public.fichas f on f.rifa_id = r.id
group by r.id;

drop view if exists public.ligadores_resumo;
create view public.ligadores_resumo
with (security_invoker = true) as
select
  l.id,
  l.username,
  l.nome,
  l.foto_url,
  l.ativo,
  l.created_at,
  count(la.id)::int as atribuidas,
  count(la.id) filter (where f.status not in ('deu_bom', 'deu_ruim'))::int as pendentes,
  count(la.id) filter (where f.status = 'deu_bom')::int as deu_bom,
  count(la.id) filter (where f.status = 'deu_ruim')::int as deu_ruim,
  (
    select max(sl.created_at)
    from public.ficha_status_log sl
    where sl.ligador_id = l.id
  ) as ultima_atividade
from public.ligadores l
left join public.ligador_acesso la on la.ligador_id = l.id
left join public.fichas f on f.id = la.ficha_id
group by l.id;

drop view if exists public.rifa_ligadores_resumo;
create view public.rifa_ligadores_resumo
with (security_invoker = true) as
select
  f.rifa_id,
  l.id as ligador_id,
  l.nome,
  l.foto_url,
  l.ativo,
  count(a.id)::int as atribuidas,
  count(a.id) filter (where f.status not in ('deu_bom', 'deu_ruim'))::int as pendentes,
  count(a.id) filter (where f.status = 'deu_bom')::int as deu_bom,
  count(a.id) filter (where f.status = 'deu_ruim')::int as deu_ruim
from public.ligador_acesso a
join public.fichas f on f.id = a.ficha_id
join public.ligadores l on l.id = a.ligador_id
group by f.rifa_id, l.id;

-- Recolher devolve tudo que ainda não foi resolvido (pendente e retornar).
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
      and f.status not in ('deu_bom', 'deu_ruim')
    returning 1
  )
  select count(*) into v_qtd from removidas;
  return v_qtd;
end
$$;

revoke all on public.rifas_resumo from anon, authenticated;
revoke all on public.ligadores_resumo from anon, authenticated;
revoke all on public.rifa_ligadores_resumo from anon, authenticated;
revoke all on function public.recolher_pendentes(uuid, uuid) from public, anon, authenticated;

insert into public._casher_migrations (nome)
values ('0008_retornar.sql')
on conflict (nome) do nothing;
