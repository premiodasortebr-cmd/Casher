-- 1) Busca num campo só: nome, CPF (só dígitos) e telefone com E sem pontuação —
--    assim "213.069", "21306968" e "(11) 99350" acham a mesma ficha. Também traz
--    o nome da rifa, pra área do ligador ler desta view.
-- 2) Uma ficha com UM ligador, garantido pelo banco (índice único em ficha_id) e
--    distribuição serializada por rifa (advisory lock) — dois admins clicando
--    "Enviar" ao mesmo tempo não mandam a mesma ficha pra dois ligadores.

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

-- Regra "um ligador por ficha" no banco. (Se algum dia existir ficha com dois
-- acessos, este índice falha — aí é limpar as duplicatas antes.)
create unique index if not exists ligador_acesso_ficha_uidx
  on public.ligador_acesso (ficha_id);

-- SKIP LOCKED sozinho não basta: em READ COMMITTED o NOT EXISTS usa o snapshot do
-- início do statement, então uma transação que começou antes da outra commitar
-- ainda "vê" as fichas como livres. O lock por rifa faz a segunda esperar a
-- primeira terminar e só então montar o snapshot.
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
  perform pg_advisory_xact_lock(hashtext(p_rifa_id::text));

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

revoke all on function public.distribuir_fichas(uuid, uuid, int) from public, anon, authenticated;
