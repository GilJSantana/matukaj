-- Documentos impressos (comprovante de vistoria e certificado de garantia) e dados da oficina.

-- linha unica (ADR 003): cabecalho dos documentos e padroes da garantia
create table public.oficina_config (
  id boolean primary key default true check (id),
  razao_social text not null,
  -- somente digitos
  cnpj text check (cnpj ~ '^[0-9]{14}$'),
  endereco text,
  telefone text check (telefone ~ '^55[0-9]{10,11}$'),
  garantia_prazo_padrao_meses integer not null default 6 check (garantia_prazo_padrao_meses > 0),
  garantia_km_padrao integer check (garantia_km_padrao > 0),
  garantia_condicoes_padrao text
);

insert into public.oficina_config (razao_social, garantia_km_padrao, garantia_condicoes_padrao) values (
  'Retífica de Motores Matukaj',
  10000,
  'A garantia cobre exclusivamente os serviços e peças descritos neste certificado, contra defeitos de execução e de material.

Para manter a garantia, o proprietário deve:
- respeitar o amaciamento: nos primeiros 1.000 km, não exceder 3.000 rpm nem rodar com carga excessiva;
- trocar o óleo e o filtro de óleo aos 1.000 km e seguir o plano de manutenção do fabricante;
- manter o sistema de arrefecimento com aditivo na proporção correta e sem vazamentos.

A garantia perde a validade em caso de:
- superaquecimento, falta de óleo ou de líquido de arrefecimento;
- uso de combustível adulterado ou de óleo fora da especificação;
- desmontagem ou reparo do motor por terceiros;
- uso em competições ou com sobrecarga.

Em caso de defeito, procure a oficina antes de qualquer intervenção, apresentando este certificado.'
);

alter table public.oficina_config enable row level security;

create policy "usuario ativo le dados da oficina" on public.oficina_config
  for select to authenticated using ((select public.usuario_ativo()));
create policy "admin edita dados da oficina" on public.oficina_config
  for update to authenticated using ((select public.is_admin()));

-- garantia de motor e contada em meses; ainda nao havia tela usando a coluna
alter table public.garantias rename column prazo_dias to prazo_meses;

-- uma garantia por OS
drop index public.garantias_ordem_servico_id_idx;
alter table public.garantias add constraint garantias_ordem_servico_id_key unique (ordem_servico_id);

create policy "usuario ativo le garantias" on public.garantias
  for select to authenticated using ((select public.usuario_ativo()));

-- so emite garantia de servico ja concluido
create policy "usuario ativo emite garantia de OS concluida" on public.garantias
  for insert to authenticated with check (
    (select public.usuario_ativo())
    and exists (
      select 1 from public.ordens_servico o
      where o.id = ordem_servico_id and o.status in ('concluida', 'entregue')
    )
  );
