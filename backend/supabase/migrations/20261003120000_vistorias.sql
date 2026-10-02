-- Vistoria de recepcao (ADR 003): checklist e avarias em JSONB, definicao versionada.

create extension if not exists pg_jsonschema with schema extensions;

create table public.checklist_modelos (
  id bigint generated always as identity primary key,
  versao integer not null unique,
  -- { itens: [{ chave, rotulo }], tipos_avaria: [{ chave, rotulo, simbolo }] }
  definicao jsonb not null check (jsonb_typeof(definicao) = 'object'),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- uma unica versao ativa por vez
create unique index checklist_modelos_ativo_idx on public.checklist_modelos (ativo) where ativo;

insert into public.checklist_modelos (versao, definicao) values (1, '{
  "itens": [
    { "chave": "estepe", "rotulo": "Estepe" },
    { "chave": "triangulo", "rotulo": "Triângulo" },
    { "chave": "macaco", "rotulo": "Macaco" },
    { "chave": "pneus", "rotulo": "Pneus em bom estado" }
  ],
  "tipos_avaria": [
    { "chave": "batido", "rotulo": "Batido", "simbolo": "X" },
    { "chave": "riscado", "rotulo": "Riscado", "simbolo": "-" },
    { "chave": "quebrado", "rotulo": "Quebrado", "simbolo": "O" }
  ]
}');

create table public.vistorias (
  id bigint generated always as identity primary key,
  ordem_servico_id bigint not null unique references public.ordens_servico (id) on delete cascade,
  checklist_modelo_id bigint not null references public.checklist_modelos (id) on delete restrict,
  -- 0 = vazio ... 4 = cheio, em quartos de tanque
  nivel_combustivel smallint check (nivel_combustivel between 0 and 4),
  -- { "<chave do item>": { "ok": boolean } }
  checklist jsonb not null default '{}' check (jsonb_typeof(checklist) = 'object'),
  -- coordenadas normalizadas 0..1 sobre a imagem da vista (ADR 003, regra 1)
  avarias jsonb not null default '[]' check (extensions.jsonb_matches_schema('{
    "type": "array",
    "items": {
      "type": "object",
      "required": ["vista", "x", "y", "tipo"],
      "properties": {
        "vista": { "enum": ["frente", "traseira", "lateral_esquerda", "lateral_direita", "teto"] },
        "x": { "type": "number", "minimum": 0, "maximum": 1 },
        "y": { "type": "number", "minimum": 0, "maximum": 1 },
        "tipo": { "type": "string" },
        "descricao": { "type": "string" },
        "foto_path": { "type": "string" }
      }
    }
  }', avarias)),
  observacoes text,
  realizada_por uuid default auth.uid() references auth.users (id) on delete set null,
  realizada_em timestamptz not null default now()
);

create index vistorias_checklist_modelo_id_idx on public.vistorias (checklist_modelo_id);

alter table public.checklist_modelos enable row level security;
alter table public.vistorias enable row level security;

create policy "usuario ativo le modelos de checklist" on public.checklist_modelos
  for select to authenticated using ((select public.usuario_ativo()));

create policy "usuario ativo le OS" on public.ordens_servico
  for select to authenticated using ((select public.usuario_ativo()));
create policy "usuario ativo abre OS" on public.ordens_servico
  for insert to authenticated with check ((select public.usuario_ativo()));

create policy "usuario ativo le vistorias" on public.vistorias
  for select to authenticated using ((select public.usuario_ativo()));
create policy "usuario ativo registra vistorias" on public.vistorias
  for insert to authenticated with check ((select public.usuario_ativo()));

-- abre a OS (orcamento) e grava a vistoria de recepcao na mesma transacao
create function public.registrar_vistoria(
  veiculo_id bigint,
  checklist_modelo_id bigint,
  checklist jsonb,
  avarias jsonb,
  km_entrada integer default null,
  nivel_combustivel smallint default null,
  observacoes text default null
) returns bigint
language plpgsql set search_path = ''
as $$
declare
  os_id bigint;
begin
  insert into public.ordens_servico (veiculo_id, cliente_id, km_entrada)
  select v.id, v.cliente_id, registrar_vistoria.km_entrada
  from public.veiculos v where v.id = registrar_vistoria.veiculo_id
  returning id into os_id;

  if os_id is null then
    raise exception 'veiculo % nao encontrado', veiculo_id using errcode = 'P0002';
  end if;

  insert into public.vistorias
    (ordem_servico_id, checklist_modelo_id, nivel_combustivel, checklist, avarias, observacoes)
  values (
    os_id, registrar_vistoria.checklist_modelo_id, registrar_vistoria.nivel_combustivel,
    registrar_vistoria.checklist, registrar_vistoria.avarias, registrar_vistoria.observacoes
  );

  return os_id;
end;
$$;
