-- Painel RO — Sincronização com Google Drive (Drive → Lote)
-- O lote é vinculado a uma pasta do Drive (drive_folder_id). Um cron varre as
-- pastas e importa para `documentos` os arquivos que ainda não foram registrados.

-- ============================================================
-- Vínculo do lote com a pasta do Google Drive
-- ============================================================
alter table public.lotes
  add column if not exists drive_folder_id text;

comment on column public.lotes.drive_folder_id is
  'ID da pasta do Google Drive vinculada ao lote. Arquivos colocados nela são importados automaticamente para os documentos do lote.';

-- ============================================================
-- Rastreio da origem dos documentos
-- ============================================================
alter table public.documentos
  add column if not exists origem text not null default 'manual';

alter table public.documentos
  add column if not exists drive_file_id text;

comment on column public.documentos.origem is
  'Origem do documento: ''manual'' (upload no app) ou ''drive'' (importado do Google Drive).';
comment on column public.documentos.drive_file_id is
  'ID do arquivo no Google Drive, quando origem = ''drive''. Usado para evitar importação duplicada.';

-- Blindagem contra duplicata: um mesmo arquivo do Drive só pode ser importado
-- uma vez. Índice único parcial (ignora linhas manuais, onde é null).
create unique index if not exists uniq_documentos_drive_file_id
  on public.documentos(drive_file_id)
  where drive_file_id is not null;

-- Índice para o cron buscar rapidamente os lotes vinculados.
create index if not exists idx_lotes_drive_folder
  on public.lotes(drive_folder_id)
  where drive_folder_id is not null;
