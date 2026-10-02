begin;
select plan(8);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000d1', 'vistoriador@teste');
insert into public.perfis (id, nome, papel) values ('00000000-0000-0000-0000-0000000000d1', 'Vistoriador', 'mecanico');
insert into public.clientes (nome) values ('Cliente Vistoria');
insert into public.veiculos (cliente_id, placa) select id, 'VIS1T00' from public.clientes where nome = 'Cliente Vistoria';

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d1", "role": "authenticated"}';

select is(
  (select definicao -> 'tipos_avaria' -> 0 ->> 'simbolo' from public.checklist_modelos where ativo),
  'X', 'modelo ativo traz a legenda de avarias'
);

select lives_ok($$
  select public.registrar_vistoria(
    (select id from public.veiculos where placa = 'VIS1T00'),
    (select id from public.checklist_modelos where ativo),
    '{"estepe": {"ok": true}, "macaco": {"ok": false}}',
    '[{"vista": "teto", "x": 0.42, "y": 0.61, "tipo": "batido"}]',
    85000, 2::smallint, 'Cliente ciente do risco'
  )
$$, 'registra vistoria e abre a OS');

select is(
  (select o.cliente_id from public.ordens_servico o join public.veiculos v on v.id = o.veiculo_id
   where v.placa = 'VIS1T00'),
  (select id from public.clientes where nome = 'Cliente Vistoria'),
  'OS aberta para o dono do veiculo'
);
select is(
  (select avarias -> 0 ->> 'tipo' from public.vistorias), 'batido', 'avarias gravadas no JSONB'
);
select is(
  (select realizada_por from public.vistorias),
  '00000000-0000-0000-0000-0000000000d1'::uuid, 'vistoriador registrado'
);

select throws_ok($$
  select public.registrar_vistoria(
    (select id from public.veiculos where placa = 'VIS1T00'),
    (select id from public.checklist_modelos where ativo),
    '{}', '[{"vista": "teto", "x": 1.5, "y": 0.1, "tipo": "batido"}]')
$$, '23514', null, 'coordenada fora de 0..1 e rejeitada');

select throws_ok($$
  select public.registrar_vistoria(-1, (select id from public.checklist_modelos where ativo),
    '{}', '[]')
$$, 'P0002', null, 'veiculo inexistente e rejeitado');

set local role anon;
select is_empty('select * from public.vistorias', 'anon nao le vistorias');

select * from finish();
rollback;
