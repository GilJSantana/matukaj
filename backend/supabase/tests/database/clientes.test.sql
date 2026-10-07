begin;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'ativo@teste'),
  ('00000000-0000-0000-0000-0000000000c2', 'inativo@teste');
insert into public.perfis (id, nome, papel, ativo) values
  ('00000000-0000-0000-0000-0000000000c1', 'Ativo', 'atendente', true),
  ('00000000-0000-0000-0000-0000000000c2', 'Inativo', 'atendente', false)
on conflict (id) do update set nome = excluded.nome, papel = excluded.papel, ativo = excluded.ativo;

insert into public.clientes (nome, cpf_cnpj, data_nascimento) values
  ('Maria Souza', '12345678901', (now() at time zone 'America/Sao_Paulo')::date - interval '30 years'),
  ('Joao Lima', '98765432100', (now() at time zone 'America/Sao_Paulo')::date - interval '30 years 1 day');
insert into public.veiculos (cliente_id, placa)
  select id, 'ABC1D23' from public.clientes where nome = 'Joao Lima';

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}';

select results_eq('select nome from buscar_clientes(''souz'')', array['Maria Souza'], 'busca por nome sem acento de caixa');
select results_eq('select nome from buscar_clientes(''123.456'')', array['Maria Souza'], 'busca por CPF com mascara');
select results_eq('select nome from buscar_clientes(''abc-1d'')', array['Joao Lima'], 'busca por placa parcial');
select is_empty('select * from buscar_clientes(''   '')', 'termo vazio nao lista todos');
select results_eq('select nome from aniversariantes_do_dia()', array['Maria Souza'], 'aniversariante so no dia');

select lives_ok(
  'insert into public.clientes (nome, endereco) values (''Novo'', ''Rua A, 1'')',
  'usuario ativo cadastra cliente'
);

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c2", "role": "authenticated"}';
select is_empty('select * from public.clientes', 'usuario inativo nao le clientes');
select throws_ok(
  'insert into public.clientes (nome) values (''X'')', '42501', null,
  'usuario inativo nao cadastra'
);

set local role anon;
select is_empty('select * from public.veiculos', 'anon nao le veiculos');

select * from finish();
rollback;
