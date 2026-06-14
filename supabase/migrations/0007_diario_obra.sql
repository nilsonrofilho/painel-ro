-- Painel RO — Diário de Obra
-- Registro diário do andamento da obra de cada lote: efetivo, atividades,
-- clima, fotos e resumo. Inspirado no "Cockpit de Obra".

create table if not exists public.diarios_obra (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes(id) on delete cascade,
  data date not null,
  responsavel_id uuid references public.funcionarios(id) on delete set null,
  total_efetivo int not null default 0,
  presentes int not null default 0,
  ausentes int not null default 0,
  atividades_executadas int not null default 0,
  clima text check (clima in ('ensolarado','nublado','chuvoso','parcialmente_nublado','garoa')),
  resumo_atividades text,
  observacao text,
  fotos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (lote_id, data)
);

create index if not exists idx_diarios_lote on public.diarios_obra(lote_id, data desc);

alter table public.diarios_obra enable row level security;

drop policy if exists "authenticated_all_diarios_obra" on public.diarios_obra;
create policy "authenticated_all_diarios_obra" on public.diarios_obra
  for all to authenticated using (true) with check (true);

-- Bucket de fotos do diário de obra
insert into storage.buckets (id, name, public)
values ('diario-obra', 'diario-obra', true)
on conflict (id) do nothing;

do $$
begin
  execute 'drop policy if exists "auth_read_diario-obra" on storage.objects';
  execute 'drop policy if exists "auth_write_diario-obra" on storage.objects';
  execute 'drop policy if exists "auth_update_diario-obra" on storage.objects';
  execute 'drop policy if exists "auth_delete_diario-obra" on storage.objects';
  execute 'drop policy if exists "public_read_diario-obra" on storage.objects';

  execute 'create policy "auth_read_diario-obra" on storage.objects for select to authenticated using (bucket_id = ''diario-obra'')';
  execute 'create policy "auth_write_diario-obra" on storage.objects for insert to authenticated with check (bucket_id = ''diario-obra'')';
  execute 'create policy "auth_update_diario-obra" on storage.objects for update to authenticated using (bucket_id = ''diario-obra'')';
  execute 'create policy "auth_delete_diario-obra" on storage.objects for delete to authenticated using (bucket_id = ''diario-obra'')';
  execute 'create policy "public_read_diario-obra" on storage.objects for select to anon using (bucket_id = ''diario-obra'')';
end$$;
