-- Rifas que vêm do .csv do Serasa (ex.: Pix do Milhão) trazem cidade e data de
-- nascimento. Reexecutável; compatível com o código anterior (colunas novas no fim).

alter table public.fichas add column if not exists cidade text;
alter table public.fichas add column if not exists nascimento date;

drop view if exists public.fichas_lista;
create view public.fichas_lista
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
  l.nome as ligador_nome,
  r.nome as rifa_nome,
  concat_ws(
    ' ',
    f.nome,
    f.cpf,
    f.telefone,
    regexp_replace(coalesce(f.telefone, ''), '\D', '', 'g')
  ) as busca,
  f.telefone_confirmado,
  f.idade,
  f.profissao,
  f.renda,
  f.qtd_numeros,
  f.pagamento_valor,
  jsonb_array_length(f.compras)::int as qtd_compras,
  f.cidade
from public.fichas f
join public.rifas r on r.id = f.rifa_id
left join lateral (
  select a.ligador_id
  from public.ligador_acesso a
  where a.ficha_id = f.id
  order by a.created_at
  limit 1
) la on true
left join public.ligadores l on l.id = la.ligador_id;

revoke all on public.fichas_lista from anon, authenticated;

insert into public._casher_migrations (nome)
values ('0009_serasa.sql')
on conflict (nome) do nothing;
