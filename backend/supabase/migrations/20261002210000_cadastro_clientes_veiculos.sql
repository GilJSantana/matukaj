-- Telas de cadastro e busca de clientes/veiculos e aniversariantes do dia.

alter table public.clientes add column endereco text;
alter table public.veiculos add column numero_motor text;

-- usuario desativado em perfis perde o acesso mesmo com sessao valida
create function public.usuario_ativo() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.perfis where id = (select auth.uid()) and ativo);
$$;

create policy "usuario ativo le clientes" on public.clientes
  for select to authenticated using ((select public.usuario_ativo()));
create policy "usuario ativo cadastra clientes" on public.clientes
  for insert to authenticated with check ((select public.usuario_ativo()));
create policy "usuario ativo edita clientes" on public.clientes
  for update to authenticated using ((select public.usuario_ativo()));

create policy "usuario ativo le veiculos" on public.veiculos
  for select to authenticated using ((select public.usuario_ativo()));
create policy "usuario ativo cadastra veiculos" on public.veiculos
  for insert to authenticated with check ((select public.usuario_ativo()));
create policy "usuario ativo edita veiculos" on public.veiculos
  for update to authenticated using ((select public.usuario_ativo()));

-- busca rapida por nome, CPF/CNPJ ou placa; roda com o RLS de quem chama
create function public.buscar_clientes(termo text) returns setof public.clientes
language sql stable set search_path = ''
as $$
  with t as (
    select
      nullif(trim(termo), '') as texto,
      -- letras indicam nome ou placa: nao compara com CPF/CNPJ
      case when termo !~ '[A-Za-z]' then nullif(regexp_replace(termo, '\D', '', 'g'), '') end as digitos,
      nullif(upper(regexp_replace(termo, '[^A-Za-z0-9]', '', 'g')), '') as placa
  )
  select c.* from public.clientes c, t
  where c.nome ilike '%' || t.texto || '%'
     or c.cpf_cnpj like t.digitos || '%'
     or exists (
       select 1 from public.veiculos v
       where v.cliente_id = c.id and v.placa like t.placa || '%'
     )
  order by c.nome
  limit 20;
$$;

-- dia no fuso da oficina; usa o indice clientes_aniversario_idx
-- ponytail: nascidos em 29/02 so aparecem em anos bissextos; tratar se a oficina pedir
create function public.aniversariantes_do_dia() returns setof public.clientes
language sql stable set search_path = ''
as $$
  select c.* from public.clientes c,
    (select (now() at time zone 'America/Sao_Paulo')::date as hoje) d
  where extract(month from c.data_nascimento) = extract(month from d.hoje)
    and extract(day from c.data_nascimento) = extract(day from d.hoje)
  order by c.nome;
$$;
