-- Nucleo do negocio (ADR 003): clientes, veiculos, catalogo, OS e itens.
-- Vistorias, garantias e tabelas de gestao entram em migrations proprias.

create extension if not exists pg_trgm with schema extensions;

create table public.clientes (
  id bigint generated always as identity primary key,
  nome text not null,
  -- somente digitos: 11 (CPF) ou 14 (CNPJ)
  cpf_cnpj text unique check (cpf_cnpj ~ '^([0-9]{11}|[0-9]{14})$'),
  -- formato wa.me: 55 + DDD + numero, somente digitos
  telefone text check (telefone ~ '^55[0-9]{10,11}$'),
  email text,
  data_nascimento date,
  created_at timestamptz not null default now()
);

-- painel de aniversariantes do dia
create index clientes_aniversario_idx on public.clientes (
  (extract(month from data_nascimento)),
  (extract(day from data_nascimento))
);
create index clientes_telefone_idx on public.clientes (telefone);

create table public.veiculos (
  id bigint generated always as identity primary key,
  cliente_id bigint not null references public.clientes (id) on delete restrict,
  -- normalizada (maiusculas, sem hifen): antiga ABC1234 ou Mercosul ABC1D23
  placa text not null unique check (placa ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
  marca text,
  modelo text,
  ano smallint check (ano between 1900 and 2100),
  cor text,
  chassi text unique,
  created_at timestamptz not null default now()
);

create index veiculos_cliente_id_idx on public.veiculos (cliente_id);

create table public.catalogo_servicos (
  id bigint generated always as identity primary key,
  descricao text not null,
  valor_sugerido numeric(12, 2) not null default 0 check (valor_sugerido >= 0),
  ativo boolean not null default true
);

-- autocomplete por texto
create index catalogo_servicos_descricao_trgm_idx
  on public.catalogo_servicos using gin (descricao extensions.gin_trgm_ops);

create type public.os_status as enum (
  'orcamento', 'aprovada', 'em_execucao', 'concluida', 'entregue', 'cancelada'
);

-- orcamento e OS no mesmo registro; o id e o numero sequencial da OS
create table public.ordens_servico (
  id bigint generated always as identity primary key,
  veiculo_id bigint not null references public.veiculos (id) on delete restrict,
  -- cliente gravado na OS: o veiculo pode trocar de dono depois
  cliente_id bigint not null references public.clientes (id) on delete restrict,
  status public.os_status not null default 'orcamento',
  km_entrada integer check (km_entrada >= 0),
  pdf_path text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  aberta_em timestamptz not null default now(),
  concluida_em timestamptz
);

create index ordens_servico_status_idx on public.ordens_servico (status);
create index ordens_servico_veiculo_id_idx on public.ordens_servico (veiculo_id);
create index ordens_servico_cliente_id_idx on public.ordens_servico (cliente_id);

create table public.itens_os (
  id bigint generated always as identity primary key,
  ordem_servico_id bigint not null references public.ordens_servico (id) on delete cascade,
  -- opcional: digitacao livre fica com servico_id nulo
  servico_id bigint references public.catalogo_servicos (id) on delete set null,
  -- copia do texto: alterar o catalogo nao altera OS emitidas
  descricao text not null,
  quantidade numeric(10, 2) not null default 1 check (quantidade > 0),
  valor_unitario numeric(12, 2) not null check (valor_unitario >= 0)
);

create index itens_os_ordem_servico_id_idx on public.itens_os (ordem_servico_id);
create index itens_os_servico_id_idx on public.itens_os (servico_id);

-- a anon key e publica: sem policy, todo acesso via API e negado
alter table public.clientes enable row level security;
alter table public.veiculos enable row level security;
alter table public.catalogo_servicos enable row level security;
alter table public.ordens_servico enable row level security;
alter table public.itens_os enable row level security;
