-- Painel RO — Estudo de Viabilidade Econômica de Empreendimentos
-- Parâmetros urbanísticos/fiscais por cidade e zona + estudos de viabilidade
-- com programa, custos/ITBI e fluxo de caixa. Cálculos ficam no app
-- (src/lib/viabilidade.ts), não no banco — aqui só persistência de premissas.

-- ============================================================
-- CATÁLOGOS PARAMETRIZÁVEIS (base, sem hardcode)
-- ============================================================

-- Parâmetros municipais: ITBI, % de áreas públicas etc.
create table if not exists public.municipios_parametros (
  id uuid primary key default gen_random_uuid(),
  municipio text not null,
  estado text not null,
  codigo_ibge text,
  itbi_aliquota_pct numeric not null default 2,
  itbi_base text not null default 'maior_entre'
    check (itbi_base in ('valor_transacao','valor_venal','maior_entre')),
  cub_estado text,
  areas_publicas_min_pct numeric default 35,
  vigencia_mes date,
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (municipio, estado)
);
create index if not exists idx_munpar_uf on public.municipios_parametros(estado);

-- Índices CUB (R$/m²) por estado+padrão+tipo, com histórico mensal
create table if not exists public.cub_indices (
  id uuid primary key default gen_random_uuid(),
  estado text not null,
  padrao text not null check (padrao in ('baixo','normal','alto')),
  tipo_projeto text not null
    check (tipo_projeto in ('R1','R8','R16','PP4','CAL8','loteamento','outro')),
  valor_m2 numeric not null,
  mes_referencia date not null,
  fonte text,
  created_at timestamptz not null default now(),
  unique (estado, padrao, tipo_projeto, mes_referencia)
);
create index if not exists idx_cub_busca
  on public.cub_indices(estado, padrao, tipo_projeto, mes_referencia desc);

-- Zonas urbanísticas do plano diretor por município+zona
create table if not exists public.zonas_urbanisticas (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid references public.municipios_parametros(id) on delete set null,
  municipio text not null,
  estado text not null,
  zona text not null,
  descricao text,
  densidade text,
  to_pct numeric not null default 50,
  ca_basico numeric not null default 1,
  ca_maximo numeric,
  ca_minimo numeric,
  recuo_frontal_m numeric default 0,
  recuo_lateral_m numeric default 0,
  recuo_fundos_m numeric default 0,
  gabarito_max_m numeric,
  gabarito_max_pavimentos int,
  taxa_permeabilidade_pct numeric default 0,
  permite_outorga boolean not null default false,
  fator_outorga_fp numeric,
  fator_outorga_fs numeric,
  valor_m2_terreno_pgv numeric,
  created_at timestamptz not null default now(),
  unique (municipio, estado, zona)
);
create index if not exists idx_zonas_municipio
  on public.zonas_urbanisticas(municipio, estado);

-- ============================================================
-- ESTUDO DE VIABILIDADE (cabeçalho + premissas)
-- ============================================================
create table if not exists public.estudos_viabilidade (
  id uuid primary key default gen_random_uuid(),
  loteamento_id uuid references public.loteamentos(id) on delete set null,
  nome text not null,
  municipio text,
  estado text,
  municipio_id uuid references public.municipios_parametros(id) on delete set null,
  zona_id uuid references public.zonas_urbanisticas(id) on delete set null,
  endereco text,
  lat numeric,
  lng numeric,
  tipo_empreendimento text not null default 'loteamento'
    check (tipo_empreendimento in ('loteamento','casas','vertical','misto')),
  area_terreno_m2 numeric,
  custo_terreno numeric default 0,
  valor_venal_referencia numeric,
  itbi_aliquota_pct numeric,
  outorga_valor numeric default 0,
  custos_cartorio numeric default 0,
  ca_pretendido numeric,
  fator_eficiencia numeric default 0.80,
  pe_direito_m numeric default 3,
  custo_infraestrutura numeric default 0,
  padrao_construcao text default 'normal'
    check (padrao_construcao in ('baixo','normal','alto')),
  tipo_projeto_cub text default 'R1',
  cub_valor_m2 numeric,
  bdi_pct numeric default 25,
  comissao_venda_pct numeric default 5,
  regime_tributario text default 'RET'
    check (regime_tributario in ('RET','RET_social','presumido','real')),
  imposto_venda_pct numeric default 4,
  custos_indiretos_pct numeric default 8,
  distratos_pct numeric default 0,
  custo_financeiro numeric default 0,
  tma_pct numeric default 12,
  status text not null default 'rascunho'
    check (status in ('rascunho','aprovado','reprovado')),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_estviab_loteamento
  on public.estudos_viabilidade(loteamento_id);
create index if not exists idx_estviab_status
  on public.estudos_viabilidade(status);

-- Programa (mix de unidades a construir/vender)
create table if not exists public.viabilidade_programa (
  id uuid primary key default gen_random_uuid(),
  estudo_id uuid not null references public.estudos_viabilidade(id) on delete cascade,
  tipo_unidade text not null,
  descricao text,
  quantidade int not null default 1,
  area_privativa_m2 numeric,
  area_construida_m2 numeric,
  preco_m2_venda numeric,
  valor_venda_unitario numeric,
  ordem int default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_viabprog_estudo
  on public.viabilidade_programa(estudo_id, ordem);

-- ITBI por cidade (cenários de localização dentro do estudo)
create table if not exists public.viabilidade_custos_itbi (
  id uuid primary key default gen_random_uuid(),
  estudo_id uuid not null references public.estudos_viabilidade(id) on delete cascade,
  municipio_id uuid references public.municipios_parametros(id) on delete set null,
  cidade text not null,
  estado text,
  aliquota_pct numeric not null,
  base_calculo numeric not null default 0,
  valor_estimado numeric not null default 0,
  selecionado boolean not null default false,
  atualizado_em timestamptz not null default now(),
  unique (estudo_id, cidade)
);
create index if not exists idx_viabitbi_estudo
  on public.viabilidade_custos_itbi(estudo_id);

-- Fluxo de caixa periódico (mensal) para TIR/VPL/payback/exposição
create table if not exists public.viabilidade_fluxo (
  id uuid primary key default gen_random_uuid(),
  estudo_id uuid not null references public.estudos_viabilidade(id) on delete cascade,
  periodo int not null,
  rotulo text,
  entradas numeric not null default 0,
  saidas numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (estudo_id, periodo)
);
create index if not exists idx_viabfluxo_estudo
  on public.viabilidade_fluxo(estudo_id, periodo);

-- ============================================================
-- RLS — authenticated tem acesso total (padrão do MVP)
-- ============================================================
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'municipios_parametros','cub_indices','zonas_urbanisticas',
      'estudos_viabilidade','viabilidade_programa',
      'viabilidade_custos_itbi','viabilidade_fluxo'
    ])
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "authenticated_all_%I" on public.%I;', t, t);
    execute format(
      'create policy "authenticated_all_%I" on public.%I for all to authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end$$;

-- ============================================================
-- SEED mínimo (RN/RO) — defaults que o usuário pode editar depois
-- ============================================================
insert into public.municipios_parametros (municipio, estado, itbi_aliquota_pct, itbi_base, cub_estado, observacao)
values
  ('Natal', 'RN', 3, 'maior_entre', 'RN', 'ITBI 3% sobre o maior valor (venal x transação)'),
  ('Parnamirim', 'RN', 2, 'maior_entre', 'RN', null),
  ('Mossoró', 'RN', 2, 'maior_entre', 'RN', null),
  ('Goiânia', 'GO', 2, 'maior_entre', 'GO', null)
on conflict (municipio, estado) do nothing;

insert into public.cub_indices (estado, padrao, tipo_projeto, valor_m2, mes_referencia, fonte)
values
  ('RN', 'normal', 'R1', 2300, date_trunc('month', current_date)::date, 'Sinduscon-RN (referência)'),
  ('RN', 'baixo', 'R1', 1900, date_trunc('month', current_date)::date, 'Sinduscon-RN (referência)'),
  ('RN', 'alto', 'R1', 2900, date_trunc('month', current_date)::date, 'Sinduscon-RN (referência)'),
  ('GO', 'normal', 'R1', 2200, date_trunc('month', current_date)::date, 'Sinduscon-GO (referência)')
on conflict do nothing;

insert into public.zonas_urbanisticas
  (municipio, estado, zona, descricao, densidade, to_pct, ca_basico, ca_maximo, recuo_frontal_m, recuo_lateral_m, recuo_fundos_m, taxa_permeabilidade_pct)
values
  ('Natal', 'RN', 'ZR-1', 'Zona Residencial 1 (baixa densidade)', 'baixa', 50, 1.2, 1.8, 5, 1.5, 3, 20),
  ('Natal', 'RN', 'ZM-2', 'Zona Mista 2 (média densidade)', 'media', 60, 2.0, 3.0, 4, 1.5, 3, 15),
  ('Goiânia', 'GO', 'ZR-1', 'Zona Residencial 1', 'baixa', 50, 1.0, 1.5, 5, 1.5, 3, 20)
on conflict (municipio, estado, zona) do nothing;
