-- Rifa é a rifa de verdade (ex.: "Bolada Pix"); a edição que vem no .txt não importa.
-- Até aqui o importador criava uma rifa por edição ("Edição 07 Bolada Pix - R$ 300.000",
-- "Edição 09 ..."). Esta migration junta essas "rifas-edição" numa rifa só e passa a
-- valer UMA ficha por pessoa (CPF) em cada rifa.
--
-- Reexecutável: rodar de novo não junta nem apaga mais nada.

drop view if exists public.rifas_resumo;

-- A chave de ficha deixa de ser a compra (pedido) e passa a ser a pessoa (CPF).
drop index if exists public.fichas_rifa_pedido_uidx;

-- 1) "Edição 07 Bolada Pix - R$ 300.000" -> "Bolada Pix". A primeira edição de cada
--    grupo vira a rifa (mantém o id); as outras despejam as fichas nela e somem.
do $$
declare
  r record;
  v_base text;
  v_destino uuid;
begin
  for r in
    select id, nome
    from public.rifas
    where nome ~* '^\s*edi[çc][ãa]o\s*\d+'
    order by created_at, nome
  loop
    v_base := btrim(split_part(
      regexp_replace(r.nome, '^\s*edi[çc][ãa]o\s*\d+\s*[-–—:]?\s*', '', 'i'),
      ' - ', 1
    ));
    continue when v_base = '';

    select id into v_destino
    from public.rifas
    where lower(btrim(nome)) = lower(v_base) and id <> r.id;

    if v_destino is null then
      update public.rifas set nome = v_base where id = r.id;
    else
      update public.fichas set rifa_id = v_destino where rifa_id = r.id;
      delete from public.rifas where id = r.id;
    end if;
  end loop;
end
$$;

-- 2) Mesma pessoa repetida na mesma rifa: fica a ficha que já andou (marcada, com
--    ligador, mexida por último); as outras são apagadas (acesso e log vão junto).
with ranqueadas as (
  select
    f.id,
    row_number() over (
      partition by f.rifa_id, f.cpf
      order by
        (f.status <> 'pendente') desc,
        exists (select 1 from public.ligador_acesso a where a.ficha_id = f.id) desc,
        f.status_atualizado_em desc nulls last,
        f.created_at,
        f.id
    ) as n
  from public.fichas f
)
delete from public.fichas f
using ranqueadas x
where x.id = f.id and x.n > 1;

create unique index if not exists fichas_rifa_cpf_uidx on public.fichas (rifa_id, cpf);

-- 3) Prêmio e data do sorteio eram da edição — a rifa não tem.
alter table public.rifas drop column if exists premio_descricao;
alter table public.rifas drop column if exists premio_valor;
alter table public.rifas drop column if exists data_sorteio;

-- "Bolada Pix" e "bolada pix " são a mesma rifa.
create unique index if not exists rifas_nome_lower_uidx on public.rifas (lower(btrim(nome)));

create view public.rifas_resumo
with (security_invoker = true) as
select
  r.id,
  r.nome,
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

revoke all on public.rifas_resumo from anon, authenticated;

-- 4) As migrations até aqui foram coladas à mão no SQL Editor. Registra todas, pra
--    que o runner (npm start com DATABASE_URL) não tente reaplicar as antigas — elas
--    foram escritas pro schema de antes desta.
create table if not exists public._casher_migrations (
  nome text primary key,
  aplicada_em timestamptz not null default now()
);
alter table public._casher_migrations enable row level security;
insert into public._casher_migrations (nome)
values
  ('0001_init.sql'),
  ('0002_resumos.sql'),
  ('0003_distribuicao.sql'),
  ('0004_busca.sql'),
  ('0005_rifa_unica.sql')
on conflict (nome) do nothing;
