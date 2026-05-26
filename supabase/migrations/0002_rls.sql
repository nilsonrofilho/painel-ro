-- Painel RO — Row Level Security
-- MVP single-user: usuários autenticados têm acesso total.
-- Estrutura preparada para futura particionamento por owner_id.

alter table public.loteamentos enable row level security;
alter table public.quadras enable row level security;
alter table public.lotes enable row level security;
alter table public.vendas enable row level security;
alter table public.fases_obra enable row level security;
alter table public.fornecedores enable row level security;
alter table public.fornecedor_precos enable row level security;
alter table public.lancamentos_material enable row level security;
alter table public.funcionarios enable row level security;
alter table public.alocacoes enable row level security;
alter table public.corretores enable row level security;
alter table public.documentos enable row level security;
alter table public.audit_log enable row level security;

-- Policy genérica: qualquer usuário autenticado pode ler/escrever
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'loteamentos','quadras','lotes','vendas','fases_obra','fornecedores',
      'fornecedor_precos','lancamentos_material','funcionarios','alocacoes',
      'corretores','documentos','audit_log'
    ])
  loop
    execute format('drop policy if exists "authenticated_all_%I" on public.%I;', t, t);
    execute format(
      'create policy "authenticated_all_%I" on public.%I for all to authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end$$;
