-- Usuario de desenvolvimento local: admin@matukaj.local / matukaj123
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'admin@matukaj.local',
  extensions.crypt('matukaj123', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', ''
);

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  '{"sub": "00000000-0000-0000-0000-000000000001", "email": "admin@matukaj.local"}',
  'email', now(), now()
);

insert into public.perfis (id, nome, papel)
values ('00000000-0000-0000-0000-000000000001', 'Admin', 'admin');
