-- Casher — schema inicial
--
-- Login é próprio (não usa Supabase Auth):
--   /admin   -> PIN de 6 dígitos compartilhado (verificado fora do banco, via env var).
--   /ligador -> usuário + senha, contas criadas pelo admin, guardadas em `ligadores`.
--
-- Todo acesso ao banco é feito pelo servidor (Next.js) com a service role key,
-- que ignora RLS — as políticas abaixo existem como rede de segurança caso a
-- anon key seja usada por engano (nesse caso, sem policy = sem acesso).
--
-- Idempotente de propósito: esse arquivo já foi rodado à mão no SQL Editor antes
-- de existir o runner (`scripts/migrate.mjs`), então rodar de novo não pode quebrar.

create extension if not exists pgcrypto;

do $$
begin
  create type public.ficha_status as enum ('pendente', 'deu_bom', 'deu_ruim');
exception
  when duplicate_object then null;
end
$$;

-- Contas dos ligadores, criadas pelo admin no painel.
create table if not exists public.ligadores (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  nome text not null,
  foto_url text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Uma rifa = uma edição (ex.: "Edição 07 Bolada Pix - R$ 300.000").
create table if not exists public.rifas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  premio_descricao text,
  premio_valor numeric(14, 2),
  data_sorteio timestamptz,
  created_at timestamptz not null default now()
);

-- Uma ficha = uma compra de um CPF dentro de uma rifa (o que o ligador vai ligar).
create table if not exists public.fichas (
  id uuid primary key default gen_random_uuid(),
  rifa_id uuid not null references public.rifas (id) on delete cascade,
  cpf text not null,
  nome text not null,
  telefone text,
  idade int,
  profissao text,
  renda numeric(14, 2),
  pedido text,
  comprado_em timestamptz,
  pagamento_valor numeric(14, 2),
  pagamento_status text,
  pagamento_pago_em timestamptz,
  qtd_numeros int,
  status public.ficha_status not null default 'pendente',
  status_atualizado_por uuid references public.ligadores (id),
  status_atualizado_em timestamptz,
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists fichas_rifa_id_idx on public.fichas (rifa_id);
create index if not exists fichas_status_idx on public.fichas (status);
create index if not exists fichas_cpf_idx on public.fichas (cpf);

-- Evita duplicar ficha ao reimportar o mesmo arquivo (ou um arquivo com overlap).
-- NULLs nunca colidem entre si num índice único do Postgres, então fichas sem
-- "pedido" (não deveria acontecer, mas por segurança) não são bloqueadas por isso.
create unique index if not exists fichas_rifa_pedido_uidx on public.fichas (rifa_id, pedido);

-- Acesso de um ligador a uma ficha específica (o admin monta essa lista).
create table if not exists public.ligador_acesso (
  id uuid primary key default gen_random_uuid(),
  ligador_id uuid not null references public.ligadores (id) on delete cascade,
  ficha_id uuid not null references public.fichas (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (ligador_id, ficha_id)
);

create index if not exists ligador_acesso_ligador_id_idx on public.ligador_acesso (ligador_id);
create index if not exists ligador_acesso_ficha_id_idx on public.ligador_acesso (ficha_id);

-- Histórico de marcações (auditoria: quem marcou o quê e quando).
create table if not exists public.ficha_status_log (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references public.fichas (id) on delete cascade,
  ligador_id uuid not null references public.ligadores (id),
  status_anterior public.ficha_status,
  status_novo public.ficha_status not null,
  observacao text,
  created_at timestamptz not null default now()
);

alter table public.ligadores enable row level security;
alter table public.rifas enable row level security;
alter table public.fichas enable row level security;
alter table public.ligador_acesso enable row level security;
alter table public.ficha_status_log enable row level security;

-- Nenhuma policy criada de propósito: sem policy = sem acesso para as roles
-- `anon`/`authenticated`. Só a service role (usada pelo servidor) lê/escreve aqui.
