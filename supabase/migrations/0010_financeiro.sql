-- Painel RO — Módulo Financeiro
-- Contas a pagar e a receber (tabela única), com vínculo a centro de custo
-- (loteamento/lote/categoria), fornecedor, venda e corretor. Fluxo de caixa e
-- DRE são calculados no app (src/lib/financeiro.ts); a "situação" (atrasado) é
-- derivada na view, não persistida.

create table if not exists public.lancamentos_financeiros (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('pagar','receber')),
  descricao text not null,
  valor numeric not null,
  valor_pago numeric,
  data_competencia date,
  data_vencimento date not null,
  data_pagamento date,
  status text not null default 'pendente'
    check (status in ('pendente','pago','cancelado')),
  categoria text not null default 'outro'
    check (categoria in ('obra','terreno','administrativo','marketing','comissao','imposto','financeiro','venda','outro')),
  loteamento_id uuid references public.loteamentos(id) on delete set null,
  lote_id uuid references public.lotes(id) on delete set null,
  fase_id uuid references public.fases_obra(id) on delete set null,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  venda_id uuid references public.vendas(id) on delete set null,
  corretor_id uuid references public.corretores(id) on delete set null,
  forma_pagamento text check (forma_pagamento in ('pix','boleto','transferencia','dinheiro','cartao')),
  nota_fiscal_numero text,
  comprovante_url text,
  observacao text,
  parcela_numero int,
  total_parcelas int,
  grupo_id uuid,
  recorrencia text not null default 'none'
    check (recorrencia in ('none','mensal','semanal','anual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lancfin_vencimento on public.lancamentos_financeiros(data_vencimento);
create index if not exists idx_lancfin_pagamento on public.lancamentos_financeiros(data_pagamento);
create index if not exists idx_lancfin_tipo_status on public.lancamentos_financeiros(tipo, status);
create index if not exists idx_lancfin_loteamento on public.lancamentos_financeiros(loteamento_id);
create index if not exists idx_lancfin_lote on public.lancamentos_financeiros(lote_id);
create index if not exists idx_lancfin_grupo on public.lancamentos_financeiros(grupo_id);

alter table public.lancamentos_financeiros enable row level security;
drop policy if exists "authenticated_all_lancamentos_financeiros" on public.lancamentos_financeiros;
create policy "authenticated_all_lancamentos_financeiros" on public.lancamentos_financeiros
  for all to authenticated using (true) with check (true);

-- Bucket de comprovantes (espelha 'diario-obra' do 0007)
insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', true)
on conflict (id) do nothing;

do $$
begin
  execute 'drop policy if exists "auth_read_comprovantes" on storage.objects';
  execute 'drop policy if exists "auth_write_comprovantes" on storage.objects';
  execute 'drop policy if exists "auth_update_comprovantes" on storage.objects';
  execute 'drop policy if exists "auth_delete_comprovantes" on storage.objects';
  execute 'drop policy if exists "public_read_comprovantes" on storage.objects';

  execute 'create policy "auth_read_comprovantes" on storage.objects for select to authenticated using (bucket_id = ''comprovantes'')';
  execute 'create policy "auth_write_comprovantes" on storage.objects for insert to authenticated with check (bucket_id = ''comprovantes'')';
  execute 'create policy "auth_update_comprovantes" on storage.objects for update to authenticated using (bucket_id = ''comprovantes'')';
  execute 'create policy "auth_delete_comprovantes" on storage.objects for delete to authenticated using (bucket_id = ''comprovantes'')';
  execute 'create policy "public_read_comprovantes" on storage.objects for select to anon using (bucket_id = ''comprovantes'')';
end$$;
