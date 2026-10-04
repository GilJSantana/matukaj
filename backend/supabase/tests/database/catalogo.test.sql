begin;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'admin@catalogo'),
  ('00000000-0000-0000-0000-0000000000f2', 'atendente@catalogo');
insert into public.perfis (id, nome, papel) values
  ('00000000-0000-0000-0000-0000000000f1', 'Admin', 'admin'),
  ('00000000-0000-0000-0000-0000000000f2', 'Atendente', 'atendente');

-- isola do catalogo de exemplo do seed
delete from public.catalogo_servicos;

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f1", "role": "authenticated"}';

select lives_ok($$
  insert into public.catalogo_servicos (descricao, valor_sugerido, ativo) values
    ('Retífica de bloco', 1800, true),
    ('Junta para retífica', 50, true),
    ('Retífica antiga', 10, false),
    ('Alinhamento', 120, true)
$$, 'admin cadastra servicos');

select results_eq(
  'select descricao from buscar_servicos(''RETIFICA'')',
  array['Retífica de bloco', 'Junta para retífica'],
  'busca ignora acento e caixa, prefixo primeiro e sem inativos'
);
select is_empty('select * from buscar_servicos(''  '')', 'termo vazio nao lista o catalogo');

select lives_ok(
  'update public.catalogo_servicos set valor_sugerido = 130 where descricao = ''Alinhamento''',
  'admin altera preco'
);
select throws_ok('delete from public.catalogo_servicos', '42501', null, 'ninguem exclui servico');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f2", "role": "authenticated"}';
select results_eq(
  'select valor_sugerido from buscar_servicos(''alinha'')', array[130::numeric(12, 2)],
  'atendente consulta o catalogo'
);
select throws_ok(
  'insert into public.catalogo_servicos (descricao) values (''X'')', '42501', null,
  'atendente nao cadastra'
);
update public.catalogo_servicos set valor_sugerido = 1 where descricao = 'Alinhamento';
select results_eq(
  'select valor_sugerido from public.catalogo_servicos where descricao = ''Alinhamento''',
  array[130::numeric(12, 2)], 'atendente nao altera preco'
);

set local role anon;
select is_empty('select * from public.catalogo_servicos', 'anon nao le catalogo');

select * from finish();
rollback;
