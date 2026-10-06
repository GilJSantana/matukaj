begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'admin@oficina'),
  ('00000000-0000-0000-0000-0000000000f2', 'mecanico@oficina');
insert into public.perfis (id, nome, papel) values
  ('00000000-0000-0000-0000-0000000000f1', 'Admin', 'admin'),
  ('00000000-0000-0000-0000-0000000000f2', 'Mecanico', 'mecanico');

select throws_ok(
  'insert into public.oficina_config (razao_social) values (''Outra'')', '23505', null,
  'oficina_config tem linha unica'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f2", "role": "authenticated"}';

select is((select validade_orcamento_dias from public.oficina_config), 15, 'mecanico le a validade padrao');
select throws_ok(
  'update public.oficina_config set razao_social = ''Hack'' where id', '42501', null,
  'mecanico nao edita dados da oficina'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('documentos-os', 'logos/logo_oficina.png')$$,
  '42501', null, 'mecanico nao envia logo'
);

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f1", "role": "authenticated"}';

select lives_ok(
  'update public.oficina_config set razao_social = ''Matukaj'', validade_orcamento_dias = 30,
   logo_path = ''logos/logo_oficina.png'' where id',
  'admin edita dados da oficina'
);
select is((select validade_orcamento_dias from public.oficina_config), 30, 'edicao persistida');
select throws_ok(
  'update public.oficina_config set validade_orcamento_dias = 0 where id', '23514', null,
  'validade precisa ser positiva'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('documentos-os', 'logos/logo_oficina.png')$$,
  'admin envia logo'
);

select * from finish();
rollback;
