-- Catalogo de servicos: autocomplete dos itens da OS, com digitacao livre como fallback.

create extension if not exists unaccent with schema extensions;

create policy "usuario ativo le catalogo" on public.catalogo_servicos
  for select to authenticated using ((select public.usuario_ativo()));

-- precos padrao sao decisao da gestao
create policy "admin cadastra servicos" on public.catalogo_servicos
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin edita servicos" on public.catalogo_servicos
  for update to authenticated using ((select public.is_admin()));

-- desativar em vez de excluir: itens antigos guardam a referencia
revoke delete on public.catalogo_servicos from anon, authenticated;

-- busca sem acento e sem caixa ("retifica" encontra "Retifica de Bloco"), so ativos
-- ponytail: varredura sequencial; criar indice trgm sobre unaccent se o catalogo passar de alguns milhares
create function public.buscar_servicos(termo text) returns setof public.catalogo_servicos
language sql stable set search_path = ''
as $$
  select s.* from public.catalogo_servicos s
  where s.ativo
    and nullif(trim(termo), '') is not null
    and extensions.unaccent(s.descricao) ilike '%' || extensions.unaccent(trim(termo)) || '%'
  order by
    -- comeca com o termo primeiro
    extensions.unaccent(s.descricao) ilike extensions.unaccent(trim(termo)) || '%' desc,
    s.descricao
  limit 8;
$$;
