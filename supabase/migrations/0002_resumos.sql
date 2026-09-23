-- Resumos agregados pro painel (contagem por status sem trazer milhares de linhas
-- pro Node). `security_invoker` faz a view respeitar a RLS das tabelas de baixo:
-- sem isso, uma view criada pelo owner vazaria os dados pra anon/authenticated.

create index if not exists ficha_status_log_created_at_idx
  on public.ficha_status_log (created_at desc);
create index if not exists ficha_status_log_ligador_id_idx
  on public.ficha_status_log (ligador_id);

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
  )::int as sem_ligador
from public.rifas r
left join public.fichas f on f.rifa_id = r.id
group by r.id;

-- Nunca expõe password_hash. "atribuidas/pendentes/deu_*" contam a fila do
-- ligador (fichas liberadas pra ele), independente de quem marcou.
create or replace view public.ligadores_resumo
with (security_invoker = true) as
select
  l.id,
  l.username,
  l.nome,
  l.foto_url,
  l.ativo,
  l.created_at,
  count(la.id)::int as atribuidas,
  count(la.id) filter (where f.status = 'pendente')::int as pendentes,
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

revoke all on public.rifas_resumo from anon, authenticated;
revoke all on public.ligadores_resumo from anon, authenticated;
