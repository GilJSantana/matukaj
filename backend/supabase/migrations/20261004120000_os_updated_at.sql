-- Painel de atendimentos ativos na Home: ordena pela ultima movimentacao da OS.

alter table public.ordens_servico
  add column updated_at timestamptz not null default now();

-- OS existentes: a ultima movimentacao conhecida
update public.ordens_servico set updated_at = coalesce(concluida_em, aberta_em);

create function public.tocar_updated_at() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tocar_updated_at
  before update on public.ordens_servico
  for each row execute function public.tocar_updated_at();

-- so os atendimentos em andamento entram no indice
create index ordens_servico_ativas_idx on public.ordens_servico (updated_at desc)
  where status not in ('entregue', 'cancelada');
