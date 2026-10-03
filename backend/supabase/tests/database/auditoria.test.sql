begin;
select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@teste'),
  ('00000000-0000-0000-0000-00000000000b', 'atendente@teste');
insert into public.perfis (id, nome, papel) values
  ('00000000-0000-0000-0000-00000000000a', 'Admin', 'admin'),
  ('00000000-0000-0000-0000-00000000000b', 'Atendente', 'atendente');

-- simula requisicao do atendente: auth.uid() le o sub do JWT
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';

insert into public.clientes (nome) values ('Cliente');
insert into public.veiculos (cliente_id, placa) select id, 'ABC1D23' from public.clientes;
insert into public.ordens_servico (veiculo_id, cliente_id) select id, cliente_id from public.veiculos;
insert into public.itens_os (ordem_servico_id, descricao, valor_unitario)
  select id, 'Retifica', 100 from public.ordens_servico;
insert into public.garantias (ordem_servico_id, prazo_dias) select id, 90 from public.ordens_servico;

select is(
  (select count(*)::int from public.auditoria where acao = 'INSERT'), 3,
  'INSERT em OS, item e garantia e auditado'
);

update public.itens_os set valor_unitario = 150;
select is(
  (select (dados_anteriores ->> 'valor_unitario')::numeric from public.auditoria
   where tabela = 'itens_os' and acao = 'UPDATE'),
  100::numeric, 'UPDATE de item guarda o valor anterior'
);

update public.garantias set prazo_dias = 180;
select is(
  (select (dados_anteriores ->> 'prazo_dias')::int from public.auditoria
   where tabela = 'garantias' and acao = 'UPDATE'),
  90, 'UPDATE de garantia guarda o prazo anterior'
);

delete from public.itens_os;
select is(
  (select dados_anteriores ->> 'descricao' from public.auditoria
   where tabela = 'itens_os' and acao = 'DELETE'),
  'Retifica', 'DELETE guarda a linha removida'
);

-- itens so mudam no orcamento: a aprovacao vem depois e precisa de um item
insert into public.itens_os (ordem_servico_id, descricao, valor_unitario)
  select id, 'Bloco', 200 from public.ordens_servico;

update public.ordens_servico set status = 'aprovada';
select is(
  (select dados_anteriores ->> 'status' from public.auditoria
   where tabela = 'ordens_servico' and acao = 'UPDATE'),
  'orcamento', 'UPDATE guarda o status anterior'
);
select is(
  (select usuario_id from public.auditoria where tabela = 'ordens_servico' and acao = 'UPDATE'),
  '00000000-0000-0000-0000-00000000000b'::uuid, 'UPDATE registra auth.uid()'
);

update public.ordens_servico set status = status;
select is(
  (select count(*)::int from public.auditoria where tabela = 'ordens_servico' and acao = 'UPDATE'), 1,
  'UPDATE sem mudanca nao e auditado'
);

-- RLS
set local role authenticated;
select is_empty('select * from public.auditoria', 'nao-admin nao le auditoria');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select isnt_empty('select * from public.auditoria', 'admin le auditoria');

select throws_ok('update public.auditoria set acao = ''DELETE''', '42501', null, 'admin nao altera');
select throws_ok('delete from public.auditoria', '42501', null, 'admin nao exclui');
select throws_ok('select public.expurgar_auditoria()', '42501', null, 'authenticated nao expurga');

-- expurgo
reset role;
update public.auditoria set created_at = now() - interval '2 years'
  where tabela = 'itens_os';
select is(public.expurgar_auditoria(), 4::bigint, 'expurgo remove so registros fora da retencao');

select * from finish();
rollback;
