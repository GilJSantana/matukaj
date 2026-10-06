-- US-33: tela de configuracoes da oficina (logotipo e validade do orcamento).

alter table public.oficina_config
  add column logo_path text,
  add column validade_orcamento_dias integer not null default 15 check (validade_orcamento_dias > 0);

-- with check (em vez de so using): nao-admin recebe 42501 em vez de um update silencioso de 0 linhas
drop policy "admin edita dados da oficina" on public.oficina_config;
create policy "admin edita dados da oficina" on public.oficina_config
  for update to authenticated
  using ((select public.usuario_ativo()))
  with check ((select public.is_admin()));

-- bucket privado: tambem guardara os PDFs das OS (ADR 002)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos-os', 'documentos-os', false, 5242880, array['image/png', 'image/jpeg', 'application/pdf'])
on conflict (id) do nothing;

create policy "usuario ativo le logo da oficina" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos-os' and name like 'logos/%' and (select public.usuario_ativo()));
create policy "admin envia logo da oficina" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos-os' and name like 'logos/%' and (select public.is_admin()));
-- upsert do mesmo caminho substitui o logo anterior
create policy "admin substitui logo da oficina" on storage.objects
  for update to authenticated
  using (bucket_id = 'documentos-os' and name like 'logos/%' and (select public.is_admin()));
