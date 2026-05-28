-- Painel RO — catálogo global de materiais
-- Permite cadastrar materiais uma vez e selecioná-los nos lançamentos do lote,
-- mantendo nome/unidade/categoria consistentes em toda a operação.

create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  unidade text,
  categoria text,
  preco_referencia numeric,
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (nome)
);

create index if not exists idx_materiais_categoria on public.materiais(categoria);
create index if not exists idx_materiais_ativo on public.materiais(ativo);

-- Vincula opcionalmente os lançamentos ao catálogo. Mantém o campo "material" (text)
-- pra não quebrar lançamentos existentes; o novo material_id é referência opcional.
alter table public.lancamentos_material
  add column if not exists material_id uuid references public.materiais(id) on delete set null;

create index if not exists idx_lanc_material on public.lancamentos_material(material_id);

-- RLS
alter table public.materiais enable row level security;

drop policy if exists "authenticated_all_materiais" on public.materiais;
create policy "authenticated_all_materiais" on public.materiais
  for all to authenticated using (true) with check (true);
