-- Painel RO — Storage buckets
-- Buckets públicos para imagens; arquivos privados (NF/docs) usam URLs assinadas no app.

insert into storage.buckets (id, name, public)
values
  ('loteamentos', 'loteamentos', true),
  ('lotes', 'lotes', true),
  ('funcionarios', 'funcionarios', true),
  ('notas-fiscais', 'notas-fiscais', true),
  ('documentos', 'documentos', true)
on conflict (id) do nothing;

-- Policies de storage: authenticated tem acesso total
do $$
declare
  b text;
begin
  for b in
    select unnest(array[
      'loteamentos','lotes','funcionarios','notas-fiscais','documentos'
    ])
  loop
    execute format(
      'drop policy if exists "auth_read_%s" on storage.objects;', b
    );
    execute format(
      'drop policy if exists "auth_write_%s" on storage.objects;', b
    );
    execute format(
      'drop policy if exists "auth_update_%s" on storage.objects;', b
    );
    execute format(
      'drop policy if exists "auth_delete_%s" on storage.objects;', b
    );

    execute format(
      'create policy "auth_read_%s" on storage.objects for select to authenticated using (bucket_id = %L);',
      b, b
    );
    execute format(
      'create policy "auth_write_%s" on storage.objects for insert to authenticated with check (bucket_id = %L);',
      b, b
    );
    execute format(
      'create policy "auth_update_%s" on storage.objects for update to authenticated using (bucket_id = %L);',
      b, b
    );
    execute format(
      'create policy "auth_delete_%s" on storage.objects for delete to authenticated using (bucket_id = %L);',
      b, b
    );

    -- Permite leitura pública (imagens em <img src=...>)
    execute format(
      'drop policy if exists "public_read_%s" on storage.objects;', b
    );
    execute format(
      'create policy "public_read_%s" on storage.objects for select to anon using (bucket_id = %L);',
      b, b
    );
  end loop;
end$$;
