-- 0010_familhao.sql — endereço nas fichas + tabela de resgate de prêmio (/ganhador)
begin;

insert into _casher_migrations (nome) values ('0010_familhao') on conflict do nothing;

-- Endereço (vem do .txt do Familhão)
alter table fichas add column if not exists endereco text;

-- Resgate de prêmio: o ligador gerencia código/estado por CPF, o /ganhador consulta.
create table if not exists premio_resgate (
  id          uuid primary key default gen_random_uuid(),
  cpf         text not null unique,
  codigo      text,
  estado      text not null default 'bloqueado'
              check (estado in ('bloqueado', 'liberado', 'pagamento_parcial')),
  valor       numeric(14,2),
  pix_tipo    text,
  pix_chave   text,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

alter table premio_resgate enable row level security;

-- Views atualizadas: fichas_lista ganha endereco
drop view if exists fichas_lista;
create view fichas_lista with (security_invoker = true) as
select
  f.id,
  f.rifa_id,
  r.nome                         as rifa_nome,
  f.cpf,
  f.nome,
  f.telefone,
  f.telefone_confirmado,
  f.idade,
  f.profissao,
  f.renda,
  f.cidade,
  f.nascimento,
  f.endereco,
  f.pedido,
  f.comprado_em,
  f.pagamento_valor,
  f.pagamento_status,
  f.qtd_numeros,
  jsonb_array_length(coalesce(f.compras, '[]'))  as qtd_compras,
  f.status,
  f.observacao,
  f.status_atualizado_em,
  la.ligador_id,
  l.nome                         as ligador_nome,
  f.created_at,
  lower(f.cpf) || ' ' ||
  regexp_replace(f.cpf, '[^0-9]', '', 'g') || ' ' ||
  lower(coalesce(f.nome, '')) || ' ' ||
  coalesce(regexp_replace(f.telefone, '[^0-9]', '', 'g'), '')
                                 as busca
from fichas f
join rifas r on r.id = f.rifa_id
left join ligador_acesso la on la.ficha_id = f.id
left join ligadores l on l.id = la.ligador_id;

commit;
