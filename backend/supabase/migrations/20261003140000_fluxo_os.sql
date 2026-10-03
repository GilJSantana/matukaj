-- Ciclo de vida do atendimento: orcamento -> OS (aprovada) -> em execucao -> concluida -> entregue.

create policy "usuario ativo atualiza OS" on public.ordens_servico
  for update to authenticated using ((select public.usuario_ativo()));

create policy "usuario ativo le itens" on public.itens_os
  for select to authenticated using ((select public.usuario_ativo()));
create policy "usuario ativo inclui itens" on public.itens_os
  for insert to authenticated with check ((select public.usuario_ativo()));
create policy "usuario ativo edita itens" on public.itens_os
  for update to authenticated using ((select public.usuario_ativo()));
create policy "usuario ativo remove itens" on public.itens_os
  for delete to authenticated using ((select public.usuario_ativo()));

-- so avanca uma etapa por vez; cancelamento apenas antes da execucao
create function public.validar_status_os() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (old.status, new.status) in (
    ('orcamento', 'aprovada'), ('orcamento', 'cancelada'),
    ('aprovada', 'em_execucao'), ('aprovada', 'cancelada'),
    ('em_execucao', 'concluida'),
    ('concluida', 'entregue')
  ) then
    raise exception 'transicao de status invalida: % -> %', old.status, new.status
      using errcode = 'P0001';
  end if;

  if new.status = 'aprovada'
     and not exists (select 1 from public.itens_os where ordem_servico_id = new.id) then
    raise exception 'orcamento sem itens nao pode ser aprovado' using errcode = 'P0001';
  end if;

  if new.status = 'concluida' then
    new.concluida_em := now();
  end if;

  return new;
end;
$$;

create trigger validar_status_os
  before update of status on public.ordens_servico
  for each row execute function public.validar_status_os();

-- itens so mudam enquanto e orcamento: depois da aprovacao o valor esta fechado
create function public.bloquear_itens_os_aprovada() returns trigger
language plpgsql set search_path = ''
as $$
declare
  os_id bigint := coalesce(new.ordem_servico_id, old.ordem_servico_id);
begin
  if (select status from public.ordens_servico where id = os_id) <> 'orcamento' then
    raise exception 'itens so podem ser alterados no orcamento' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger bloquear_itens_os_aprovada
  before insert or update or delete on public.itens_os
  for each row execute function public.bloquear_itens_os_aprovada();
