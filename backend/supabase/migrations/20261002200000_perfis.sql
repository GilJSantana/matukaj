-- Perfil de aplicacao 1:1 com auth.users (ADR 003): o papel define o acesso via RLS.

create type public.papel_usuario as enum ('admin', 'atendente', 'mecanico');

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  papel public.papel_usuario not null,
  ativo boolean not null default true
);

alter table public.perfis enable row level security;

create policy "usuario le o proprio perfil" on public.perfis
  for select to authenticated using (id = (select auth.uid()));

-- security definer: consultado dentro de policies sem depender do RLS de perfis
create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = (select auth.uid()) and papel = 'admin' and ativo
  );
$$;
