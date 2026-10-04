begin;
select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'atendente@garantia');
insert into public.perfis (id, nome, papel) values
  ('00000000-0000-0000-0000-0000000000a1', 'Atendente', 'atendente');
insert into public.clientes (nome) values ('Cliente Garantia');
insert into public.veiculos (cliente_id, placa) select id, 'GAR1A00' from public.clientes where nome = 'Cliente Garantia';
-- uma OS em orcamento e outra ja concluida
insert into public.ordens_servico (veiculo_id, cliente_id, status, km_entrada)
  select id, cliente_id, s, 50000 from public.veiculos, unnest(array['orcamento', 'concluida']::public.os_status[]) s
  where placa = 'GAR1A00';

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';

select is(
  (select garantia_prazo_padrao_meses from public.oficina_config), 6,
  'usuario ativo le os padroes da oficina'
);

select throws_ok($$
  insert into public.garantias (ordem_servico_id, prazo_meses)
  select o.id, 6 from public.ordens_servico o join public.veiculos v on v.id = o.veiculo_id
  where v.placa = 'GAR1A00' and o.status = 'orcamento'
$$, '42501', null, 'nao emite garantia de orcamento');

select lives_ok($$
  insert into public.garantias (ordem_servico_id, prazo_meses, km_limite, condicoes)
  select o.id, 6, 10000, 'Regras' from public.ordens_servico o join public.veiculos v on v.id = o.veiculo_id
  where v.placa = 'GAR1A00' and o.status = 'concluida'
$$, 'emite garantia de OS concluida');

select throws_ok($$
  insert into public.garantias (ordem_servico_id, prazo_meses)
  select o.id, 12 from public.ordens_servico o join public.veiculos v on v.id = o.veiculo_id
  where v.placa = 'GAR1A00' and o.status = 'concluida'
$$, '23505', null, 'uma garantia por OS');

-- RLS de update filtra as linhas: nao da erro, apenas nao altera
update public.oficina_config set razao_social = 'Outra';
select results_eq(
  'select razao_social from public.oficina_config', array['Retífica de Motores Matukaj'],
  'nao-admin nao altera a oficina'
);

set local role anon;
select is_empty('select * from public.garantias', 'anon nao le garantias');

select * from finish();
rollback;
