-- US-34: gestao de usuarios e papeis (ADR 004).

-- todo usuario do Auth ganha um perfil; o papel nunca vem do metadata (o proprio usuario controla esse campo)
create function public.criar_perfil_usuario() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, papel)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), new.email, 'Usuário'), 'mecanico');
  return new;
end;
$$;

create trigger criar_perfil_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_usuario();

-- usuarios criados antes do trigger
insert into public.perfis (id, nome, papel)
select id, coalesce(email, 'Usuário'), 'mecanico' from auth.users
on conflict (id) do nothing;

-- null para usuario inativo ou sem perfil
create function public.get_meu_papel() returns public.papel_usuario
language sql stable security definer set search_path = ''
as $$
  select papel from public.perfis where id = (select auth.uid()) and ativo;
$$;

create policy "admin le todos os perfis" on public.perfis
  for select to authenticated using ((select public.is_admin()));
-- with check: nao-admin recebe 42501 em vez de um update silencioso; sem delete, usuario so e desativado
create policy "admin edita perfis" on public.perfis
  for update to authenticated
  using ((select public.usuario_ativo()))
  with check ((select public.is_admin()));

-- impede que a oficina fique sem nenhum admin ativo
create function public.manter_um_admin() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.papel = 'admin' and old.ativo and (new.papel <> 'admin' or not new.ativo)
     and not exists (select 1 from public.perfis where papel = 'admin' and ativo and id <> old.id) then
    raise exception 'A oficina precisa de pelo menos um administrador ativo.';
  end if;
  return new;
end;
$$;

create trigger manter_um_admin
  before update on public.perfis
  for each row execute function public.manter_um_admin();

-- e-mail fica em auth.users, fora do alcance da API
create function public.listar_usuarios()
returns table (id uuid, nome text, email text, papel public.papel_usuario, ativo boolean)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Somente administradores listam usuários.' using errcode = '42501';
  end if;
  return query
    select p.id, p.nome, u.email::text, p.papel, p.ativo
    from public.perfis p join auth.users u on u.id = p.id
    order by p.nome;
end;
$$;

revoke execute on function public.listar_usuarios() from public, anon;
