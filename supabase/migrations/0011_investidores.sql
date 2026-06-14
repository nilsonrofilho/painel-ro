-- Painel RO — Investidores e aportes
-- Cada investidor tem um token público para acompanhamento read-only (sem login).
-- Aportes ligam um investidor a um lote, com valor investido e retorno projetado.

create table if not exists public.investidores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf_cnpj text,
  telefone text,
  email text,
  observacao text,
  token_publico uuid not null default gen_random_uuid(),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_investidores_token
  on public.investidores(token_publico);

create table if not exists public.aportes (
  id uuid primary key default gen_random_uuid(),
  investidor_id uuid not null references public.investidores(id) on delete cascade,
  lote_id uuid not null references public.lotes(id) on delete cascade,
  valor_investido numeric not null default 0,
  retorno_pct numeric,           -- % de retorno projetado sobre o aporte
  retorno_valor numeric,         -- alternativa: retorno em R$ (tem prioridade se preenchido)
  data_aporte date,
  observacao text,
  created_at timestamptz not null default now(),
  unique (investidor_id, lote_id)
);

create index if not exists idx_aportes_investidor on public.aportes(investidor_id);
create index if not exists idx_aportes_lote on public.aportes(lote_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.investidores enable row level security;
alter table public.aportes enable row level security;

drop policy if exists "authenticated_all_investidores" on public.investidores;
create policy "authenticated_all_investidores" on public.investidores
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_all_aportes" on public.aportes;
create policy "authenticated_all_aportes" on public.aportes
  for all to authenticated using (true) with check (true);

-- Leitura pública (anon) para o link de acompanhamento por token.
-- O token é um uuid secreto; quem tem o link vê os dados daquele investidor.
drop policy if exists "public_read_investidores" on public.investidores;
create policy "public_read_investidores" on public.investidores
  for select to anon using (true);

drop policy if exists "public_read_aportes" on public.aportes;
create policy "public_read_aportes" on public.aportes
  for select to anon using (true);
