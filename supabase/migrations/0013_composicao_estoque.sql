-- Painel RO — Composição de custo das fases + estoque de materiais

-- ============================================================
-- Composição de custo: itens (insumos/serviços) dentro de cada fase de obra
-- ============================================================
create table if not exists public.composicao_custo (
  id uuid primary key default gen_random_uuid(),
  fase_id uuid not null references public.fases_obra(id) on delete cascade,
  material_id uuid references public.materiais(id) on delete set null,
  descricao text not null,
  unidade text,
  quantidade numeric not null default 1,
  valor_unitario numeric not null default 0,
  valor_total numeric not null default 0,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_composicao_fase
  on public.composicao_custo(fase_id, ordem);

alter table public.composicao_custo enable row level security;
drop policy if exists "authenticated_all_composicao_custo" on public.composicao_custo;
create policy "authenticated_all_composicao_custo" on public.composicao_custo
  for all to authenticated using (true) with check (true);

-- Trigger: o orçamento da fase passa a refletir a soma da composição
-- (quando há itens de composição cadastrados). Mantém compatível com fases
-- sem composição (que continuam com o orçamento digitado manualmente).
create or replace function public.recalcular_orcamento_fase(p_fase_id uuid)
returns void
language plpgsql
as $$
declare
  v_total numeric;
  v_qtd int;
begin
  if p_fase_id is null then
    return;
  end if;
  select coalesce(sum(valor_total), 0), count(*)
    into v_total, v_qtd
    from public.composicao_custo
   where fase_id = p_fase_id;
  -- Só sobrescreve o orçamento se houver itens de composição
  if v_qtd > 0 then
    update public.fases_obra set orcamento = v_total where id = p_fase_id;
  end if;
end;
$$;

create or replace function public.trg_composicao_orcamento()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recalcular_orcamento_fase(old.fase_id);
  else
    perform public.recalcular_orcamento_fase(new.fase_id);
    if (tg_op = 'UPDATE' and old.fase_id is distinct from new.fase_id) then
      perform public.recalcular_orcamento_fase(old.fase_id);
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists composicao_orcamento on public.composicao_custo;
create trigger composicao_orcamento
  after insert or update or delete on public.composicao_custo
  for each row execute function public.trg_composicao_orcamento();

-- ============================================================
-- Estoque de materiais
-- ============================================================
alter table public.materiais
  add column if not exists estoque_minimo numeric default 0;

comment on column public.materiais.estoque_minimo is
  'Quantidade mínima desejada em estoque; abaixo disso a UI alerta.';

-- O saldo em estoque é DERIVADO dos lançamentos com material_id:
-- entradas somam, saídas subtraem. Calculado no app (src/lib/queries.ts),
-- consistente com a abordagem de não desnormalizar saldo.
