-- Painel RO — schema inicial
-- Sistema de gestão de loteamentos, quadras, lotes, vendas, obras e financeiro

-- Extensões necessárias
create extension if not exists "pgcrypto";

-- ============================================================
-- FUNCIONÁRIOS (criada antes para ser referenciada por loteamentos.responsavel_id)
-- ============================================================
create table if not exists public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  rg text,
  funcao text,
  tipo_contratacao text check (tipo_contratacao in ('clt','diarista','empreitada')),
  salario numeric,
  diaria numeric,
  telefone text,
  endereco text,
  data_admissao date,
  foto_url text,
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  created_at timestamptz not null default now()
);

create index if not exists idx_funcionarios_status on public.funcionarios(status);

-- ============================================================
-- LOTEAMENTOS
-- ============================================================
create table if not exists public.loteamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text,
  estado text,
  endereco text,
  lat numeric,
  lng numeric,
  imagem_url text,
  data_inicio date,
  previsao_entrega date,
  responsavel_id uuid references public.funcionarios(id) on delete set null,
  status text not null default 'planejamento'
    check (status in ('planejamento','em_obra','concluido','pausado')),
  descricao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_loteamentos_status on public.loteamentos(status);

-- ============================================================
-- QUADRAS
-- ============================================================
create table if not exists public.quadras (
  id uuid primary key default gen_random_uuid(),
  loteamento_id uuid not null references public.loteamentos(id) on delete cascade,
  identificador text not null,
  descricao text,
  imagem_url text,
  created_at timestamptz not null default now(),
  unique (loteamento_id, identificador)
);

create index if not exists idx_quadras_loteamento on public.quadras(loteamento_id);

-- ============================================================
-- LOTES
-- ============================================================
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  quadra_id uuid not null references public.quadras(id) on delete cascade,
  numero text not null,
  status text not null default 'disponivel'
    check (status in ('disponivel','reservado','vendido')),
  etapa text check (etapa in ('planejamento','fundacao','alvenaria','cobertura','acabamento','concluido')),
  area_lote numeric,
  area_construida numeric,
  quartos int,
  suites int,
  banheiros int,
  vagas int,
  tipo_planta text,
  planta_url text,
  foto_url text,
  previsao_entrega date,
  data_entrega_real date,
  responsavel_id uuid references public.funcionarios(id) on delete set null,
  valor_venda numeric,
  orcamento_total numeric,
  observacoes text,
  created_at timestamptz not null default now(),
  unique (quadra_id, numero)
);

create index if not exists idx_lotes_quadra on public.lotes(quadra_id);
create index if not exists idx_lotes_status on public.lotes(status);
create index if not exists idx_lotes_etapa on public.lotes(etapa);

-- ============================================================
-- CORRETORES
-- ============================================================
create table if not exists public.corretores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  creci text,
  telefone text,
  email text,
  comissao_padrao_pct numeric,
  created_at timestamptz not null default now()
);

-- ============================================================
-- VENDAS / RESERVAS
-- ============================================================
create table if not exists public.vendas (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes(id) on delete cascade,
  tipo text not null check (tipo in ('reserva','venda')),
  cliente_nome text,
  cliente_cpf text,
  cliente_telefone text,
  cliente_email text,
  corretor_id uuid references public.corretores(id) on delete set null,
  comissao_pct numeric,
  comissao_valor numeric,
  valor numeric,
  valor_sinal numeric,
  forma_pagamento text,
  data date,
  status text not null default 'ativa'
    check (status in ('ativa','cancelada','convertida')),
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_vendas_lote on public.vendas(lote_id);
create index if not exists idx_vendas_status on public.vendas(status);
create index if not exists idx_vendas_data on public.vendas(data desc);

-- ============================================================
-- FASES DE OBRA
-- ============================================================
create table if not exists public.fases_obra (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes(id) on delete cascade,
  nome text not null,
  orcamento numeric,
  gasto numeric not null default 0,
  data_inicio date,
  data_fim date,
  status text not null default 'pendente'
    check (status in ('pendente','em_andamento','concluida')),
  ordem int not null default 0
);

create index if not exists idx_fases_lote on public.fases_obra(lote_id, ordem);

-- ============================================================
-- FORNECEDORES
-- ============================================================
create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  nome_fantasia text,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  categoria text not null default 'material'
    check (categoria in ('material','servico','ambos')),
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists public.fornecedor_precos (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.fornecedores(id) on delete cascade,
  material text not null,
  unidade text,
  preco numeric not null,
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_precos_fornecedor on public.fornecedor_precos(fornecedor_id);

-- ============================================================
-- LANÇAMENTOS DE MATERIAL
-- ============================================================
create table if not exists public.lancamentos_material (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes(id) on delete cascade,
  fase_id uuid references public.fases_obra(id) on delete set null,
  tipo text not null check (tipo in ('entrada','saida')),
  data date not null,
  material text not null,
  quantidade numeric not null,
  unidade text,
  valor_unitario numeric,
  valor_total numeric not null,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  nota_fiscal_numero text,
  nota_fiscal_url text,
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_lanc_lote on public.lancamentos_material(lote_id, data desc);
create index if not exists idx_lanc_fornecedor on public.lancamentos_material(fornecedor_id);

-- ============================================================
-- ALOCAÇÕES (mão de obra)
-- ============================================================
create table if not exists public.alocacoes (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references public.funcionarios(id) on delete cascade,
  lote_id uuid not null references public.lotes(id) on delete cascade,
  funcao_no_lote text,
  data_inicio date,
  data_fim date,
  valor_pago numeric,
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_aloc_funcionario on public.alocacoes(funcionario_id);
create index if not exists idx_aloc_lote on public.alocacoes(lote_id);

-- ============================================================
-- DOCUMENTOS (genérico)
-- ============================================================
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('lote','loteamento','funcionario','venda')),
  entidade_id uuid not null,
  nome text not null,
  etapa text,
  arquivo_url text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_documentos_entidade
  on public.documentos(entidade_tipo, entidade_id);

-- ============================================================
-- AUDIT LOG (Sprint 5 — vazio por enquanto, estrutura pronta)
-- ============================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_entidade
  on public.audit_log(entidade, entidade_id);
