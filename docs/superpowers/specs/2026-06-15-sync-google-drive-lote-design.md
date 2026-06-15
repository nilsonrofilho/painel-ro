# Sincronização Google Drive → Lote

**Data:** 2026-06-15
**Status:** Aprovado, em implementação

## Objetivo

Permitir que arquivos colocados numa pasta do Google Drive apareçam
automaticamente nos documentos do lote correspondente no Painel RO, sem o
usuário precisar subir o arquivo duas vezes. As pastas já existem na conta
`contatoroconstrucoes@gmail.com`.

## Decisões

- **Sentido:** Drive → Lote (mão única).
- **Vínculo:** o usuário cola o link da pasta do Drive em cada lote, uma vez
  (campo `lotes.drive_folder_id`). Sem adivinhação por nome.
- **Autenticação do app:** conta de serviço do Google (robô
  `painel-ro-drive@painel-499502.iam.gserviceaccount.com`), escopo
  `drive.readonly`. As pastas são compartilhadas com o email do robô.
- **Gatilho:** Vercel Cron chama `/api/cron/sync-drive`. Plano da conta é
  **Hobby**, que só permite cron 1×/dia → agendado para 06:00 UTC (`0 6 * * *`).
  Para trazer arquivos na hora, o usuário usa o botão "Sincronizar agora" no
  lote (chama a mesma `syncDrive(loteId)`).
- **O que é guardado:** só o link (`webViewLink`) do arquivo no Drive — nada é
  copiado para o Supabase Storage.
- **Sem duplicata:** cada arquivo do Drive é importado uma vez, rastreado por
  `documentos.drive_file_id` (índice único parcial no banco).

## Arquitetura

```
Vercel Cron (10 min) ──▶ GET /api/cron/sync-drive  (protegido por CRON_SECRET)
                                  │
                                  ▼  syncDrive()
            ┌─────────────────────────────────────────────┐
            │ 1. admin Supabase: lotes com drive_folder_id │
            │ 2. Google Drive: lista arquivos da pasta     │
            │ 3. diff por drive_file_id (já importados)    │
            │ 4. upsert dos novos em `documentos`          │
            │    (origem='drive', ignoreDuplicates)        │
            └─────────────────────────────────────────────┘
```

## Componentes

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/0014_drive_sync.sql` | colunas + índices |
| `src/lib/google-drive.ts` | auth da conta de serviço + listar arquivos (REST + fetch) |
| `src/lib/supabase/admin.ts` | cliente service-role (cron roda sem usuário) |
| `src/lib/drive-sync.ts` | `syncDrive(loteId?)` — lógica idempotente de importação |
| `src/app/api/cron/sync-drive/route.ts` | endpoint do cron, protegido |
| `src/lib/actions/drive.ts` | vincular pasta / sincronizar agora (UI) |
| `src/app/(app)/lotes/[id]/tabs/documentos.tsx` | card da pasta + selinho Drive |
| `vercel.json` | agendamento do cron |

## Schema (0014)

- `lotes.drive_folder_id text` — pasta vinculada.
- `documentos.origem text default 'manual'` — `'manual'` ou `'drive'`.
- `documentos.drive_file_id text` — id do arquivo no Drive.
- índice único parcial `uniq_documentos_drive_file_id` (where not null).
- índice `idx_lotes_drive_folder` para o cron.

## Tratamento de erros / casos de borda

- **Drive não configurado:** rota retorna 503; UI avisa o usuário.
- **Falha numa pasta:** o erro é acumulado por lote; os demais continuam.
- **Arquivo apagado no Drive:** o documento **permanece** no lote (não apagamos
  automaticamente). O usuário remove manualmente se quiser.
- **Reimportar manualmente um doc do Drive deletado no app:** o índice único
  impede recriação se ainda existir; após apagar no app, a próxima sync recria
  (comportamento esperado: a pasta é a fonte da verdade).
- **Corrida cron × botão:** `upsert ... ignoreDuplicates` no índice único.

## Configuração necessária (manual, fora do código)

1. `.env.local` (e Vercel env): `SUPABASE_SERVICE_ROLE_KEY`,
   `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `CRON_SECRET`.
2. Rodar a migration `0014` no Supabase. ✅ (feito)
3. Compartilhar as pastas do Drive com o email do robô. ✅ (feito)
4. **Plano Vercel:** cron a cada 10 min exige plano **Pro**. No Hobby, o cron
   roda 1×/dia — nesse caso, use o botão "Sincronizar agora" no lote.
