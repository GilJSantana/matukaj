begin;
select plan(11);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'atendente@teste');
insert into public.perfis (id, nome, papel) values ('00000000-0000-0000-0000-0000000000e1', 'Atendente', 'atendente')
on conflict (id) do update set nome = excluded.nome, papel = excluded.papel, ativo = excluded.ativo;
insert into public.clientes (nome) values ('Cliente Fluxo');
insert into public.veiculos (cliente_id, placa) select id, 'FLU1X00' from public.clientes where nome = 'Cliente Fluxo';
insert into public.ordens_servico (veiculo_id, cliente_id)
  select id, cliente_id from public.veiculos where placa = 'FLU1X00';

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e1", "role": "authenticated"}';

create temp view os as
  select o.* from public.ordens_servico o join public.veiculos v on v.id = o.veiculo_id where v.placa = 'FLU1X00';

select throws_ok(
  'update public.ordens_servico set status = ''aprovada'' where id = (select id from os)',
  'P0001', 'orcamento sem itens nao pode ser aprovado', 'nao aprova orcamento vazio'
);

select lives_ok(
  'insert into public.itens_os (ordem_servico_id, descricao, quantidade, valor_unitario)
   select id, ''Retifica do cabecote'', 1, 1500 from os',
  'inclui item no orcamento'
);

select throws_ok(
  'update public.ordens_servico set status = ''em_execucao'' where id = (select id from os)',
  'P0001', null, 'nao pula etapa'
);

update public.ordens_servico set status = 'aprovada' where id = (select id from os);
select is((select status from os), 'aprovada'::public.os_status, 'aprova orcamento e gera OS');

select throws_ok(
  'insert into public.itens_os (ordem_servico_id, descricao, valor_unitario) select id, ''Extra'', 10 from os',
  'P0001', 'itens so podem ser alterados no orcamento', 'OS aprovada nao recebe item'
);
select throws_ok(
  'delete from public.itens_os where ordem_servico_id = (select id from os)',
  'P0001', null, 'OS aprovada nao perde item'
);

update public.ordens_servico set status = 'em_execucao' where id = (select id from os);
update public.ordens_servico set status = 'concluida' where id = (select id from os);
select isnt((select concluida_em from os), null, 'conclusao registra data');

select throws_ok(
  'update public.ordens_servico set status = ''cancelada'' where id = (select id from os)',
  'P0001', null, 'nao cancela OS concluida'
);

update public.ordens_servico set status = 'entregue' where id = (select id from os);
select is((select status from os), 'entregue'::public.os_status, 'registra entrega');

select is(
  (select count(*)::int from public.auditoria where tabela = 'ordens_servico' and acao = 'UPDATE'
     and registro_id = (select id from os)),
  0, 'auditoria nao e visivel para nao-admin'
);

reset role;
select is(
  (select array_agg(dados_anteriores ->> 'status' order by id) from public.auditoria
   where tabela = 'ordens_servico' and acao = 'UPDATE' and registro_id = (select id from os)),
  array['orcamento', 'aprovada', 'em_execucao', 'concluida'], 'cada transicao fica na auditoria'
);

select * from finish();
rollback;
