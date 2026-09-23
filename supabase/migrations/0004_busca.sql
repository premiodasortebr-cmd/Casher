-- Busca num campo só: nome, CPF (só dígitos) e telefone com E sem pontuação —
-- assim "213.069", "21306968" e "(11) 99350" acham a mesma ficha. Também traz o
-- nome da rifa, pra área do ligador ler desta view em vez de montar join na mão.
-- (create or replace view: colunas novas só no fim, as antigas na mesma ordem.)
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
  l.nome as ligador_nome,
  r.nome as rifa_nome,
  concat_ws(
    ' ',
    f.nome,
    f.cpf,
    f.telefone,
    regexp_replace(coalesce(f.telefone, ''), '\D', '', 'g')
  ) as busca
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
