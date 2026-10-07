begin;
select plan(11);

-- o trigger cria os perfis como mecanico ativo
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000b1', 'admin@rbac', '{"nome": "Admin RBAC", "papel": "admin"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'mecanico@rbac', '{}');

select results_eq(
  $$select nome, papel::text, ativo from public.perfis where id = '00000000-0000-0000-0000-0000000000b1'$$,
  $$values ('Admin RBAC', 'mecanico', true)$$,
  'novo usuario vira mecanico ativo, ignorando papel do metadata'
);
select is(
  (select nome from public.perfis where id = '00000000-0000-0000-0000-0000000000b2'), 'mecanico@rbac',
  'sem nome no metadata usa o e-mail'
);

-- isola o teste dos admins ja existentes no banco
update public.perfis set papel = 'admin' where id = '00000000-0000-0000-0000-0000000000b1';
update public.perfis set ativo = false where papel = 'admin' and id <> '00000000-0000-0000-0000-0000000000b1';

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b2", "role": "authenticated"}';

select is(public.get_meu_papel(), 'mecanico'::public.papel_usuario, 'get_meu_papel do mecanico');
select results_eq('select count(*)::int from public.perfis', array[1], 'mecanico ve so o proprio perfil');
select throws_ok(
  $$update public.perfis set papel = 'admin' where id = '00000000-0000-0000-0000-0000000000b2'$$,
  '42501', null, 'mecanico nao se promove'
);
select throws_ok('select * from public.listar_usuarios()', '42501', null, 'mecanico nao lista usuarios');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b1", "role": "authenticated"}';

select is(
  (select email from public.listar_usuarios() where id = '00000000-0000-0000-0000-0000000000b2'), 'mecanico@rbac',
  'admin lista usuarios com e-mail'
);
select lives_ok(
  $$update public.perfis set papel = 'atendente', ativo = false where id = '00000000-0000-0000-0000-0000000000b2'$$,
  'admin altera papel e desativa'
);
select throws_ok(
  $$update public.perfis set ativo = false where id = '00000000-0000-0000-0000-0000000000b1'$$,
  'P0001', null, 'ultimo admin ativo nao e desativado'
);

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b2", "role": "authenticated"}';

select is(public.get_meu_papel(), null, 'usuario inativo fica sem papel');
select throws_ok(
  $$insert into public.clientes (nome) values ('Bloqueado')$$, '42501', null,
  'usuario inativo nao grava'
);

select * from finish();
rollback;
