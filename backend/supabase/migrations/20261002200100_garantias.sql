-- Termos de garantia emitidos para uma OS (ADR 003).

create table public.garantias (
  id bigint generated always as identity primary key,
  ordem_servico_id bigint not null references public.ordens_servico (id) on delete restrict,
  prazo_dias integer not null check (prazo_dias > 0),
  km_limite integer check (km_limite > 0),
  condicoes text,
  emitida_em timestamptz not null default now(),
  pdf_path text
);

create index garantias_ordem_servico_id_idx on public.garantias (ordem_servico_id);

alter table public.garantias enable row level security;
