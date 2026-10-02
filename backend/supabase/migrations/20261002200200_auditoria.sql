-- Auditoria das tabelas sensiveis (ADR 003): quem mudou OS, itens e garantias.

create table public.auditoria (
  id bigint generated always as identity primary key,
  tabela text not null,
  registro_id bigint not null,
  acao text not null check (acao in ('INSERT', 'UPDATE', 'DELETE')),
  -- linha antes da mudanca; nulo no INSERT
  dados_anteriores jsonb,
  -- nulo quando a mudanca vem de fora da API (SQL direto, service_role)
  usuario_id uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index auditoria_registro_idx on public.auditoria (tabela, registro_id);
create index auditoria_created_at_idx on public.auditoria (created_at);

alter table public.auditoria enable row level security;

create policy "admin le auditoria" on public.auditoria
  for select to authenticated using ((select public.is_admin()));

-- somente leitura para todos: so o trigger (security definer) e o expurgo escrevem
revoke all on public.auditoria from anon, authenticated, service_role;
grant select on public.auditoria to authenticated;

create function public.registrar_auditoria() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old is not distinct from new then
    return null;
  end if;
  insert into public.auditoria (tabela, registro_id, acao, dados_anteriores)
  values (
    tg_table_name,
    case when tg_op = 'INSERT' then new.id else old.id end,
    tg_op,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end
  );
  return null;
end;
$$;

create trigger auditoria_ordens_servico
  after insert or update or delete on public.ordens_servico
  for each row execute function public.registrar_auditoria();
create trigger auditoria_itens_os
  after insert or update or delete on public.itens_os
  for each row execute function public.registrar_auditoria();
create trigger auditoria_garantias
  after insert or update or delete on public.garantias
  for each row execute function public.registrar_auditoria();

-- limite de 500 MB do Free Tier: descarta registros mais antigos que a retencao
create function public.expurgar_auditoria(retencao interval default interval '1 year')
returns bigint
language sql security definer set search_path = ''
as $$
  with removidos as (
    delete from public.auditoria where created_at < now() - retencao returning 1
  )
  select count(*) from removidos;
$$;

revoke execute on function public.expurgar_auditoria(interval) from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('expurgo-auditoria', '0 3 * * *', 'select public.expurgar_auditoria()');
