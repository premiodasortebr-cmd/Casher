-- Excluir uma rifa nunca leva fichas junto: o banco recusa (antes era ON DELETE
-- CASCADE — um "excluir rifa vazia" que corresse junto com uma importação apagava
-- as fichas recém-gravadas).
alter table public.fichas drop constraint if exists fichas_rifa_id_fkey;
alter table public.fichas
  add constraint fichas_rifa_id_fkey
  foreign key (rifa_id) references public.rifas (id) on delete restrict;

insert into public._casher_migrations (nome)
values ('0006_fichas_restrict.sql')
on conflict (nome) do nothing;
