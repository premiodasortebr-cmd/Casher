-- A ficha guarda TUDO que vem no .txt: cada compra (pedido, prêmio, sorteio, data,
-- pagamento, números) e se o telefone veio "confirmado". O ligador vê tudo ao abrir
-- a ficha. As colunas pedido/comprado_em/pagamento_*/qtd_numeros continuam como
-- resumo (compra mais recente + somas).
--
-- Compatível com o código de antes (colunas novas têm default; a view só ganha
-- colunas no fim) — pode colar a qualquer momento. Reexecutável.

alter table public.fichas add column if not exists compras jsonb not null default '[]'::jsonb;
alter table public.fichas add column if not exists telefone_confirmado boolean not null default false;

-- Fichas importadas antes desta migration: a única compra que tinha sido guardada.
update public.fichas
set compras = jsonb_build_array(jsonb_build_object(
  'pedido', pedido,
  'titulo', null,
  'premio', null,
  'sorteio_em', null,
  'comprado_em', comprado_em,
  'pagamento_metodo', null,
  'pagamento_status', pagamento_status,
  'pagamento_valor', pagamento_valor,
  'pagamento_pago_em', pagamento_pago_em,
  'qtd_numeros', qtd_numeros
))
where compras = '[]'::jsonb
  and (pedido is not null or comprado_em is not null or qtd_numeros is not null);

-- Lista do ligador e do admin: o resumo da pessoa e das compras, sem o jsonb inteiro.
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
  jsonb_array_length(f.compras)::int as qtd_compras
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
values ('0007_ficha_completa.sql')
on conflict (nome) do nothing;
