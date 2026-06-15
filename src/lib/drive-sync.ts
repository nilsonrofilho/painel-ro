import { createAdminClient } from "@/lib/supabase/admin";
import {
  isDriveConfigured,
  listFilesInFolder,
  DriveNotConfiguredError,
} from "@/lib/google-drive";

export interface SyncResult {
  lotesVerificados: number;
  arquivosImportados: number;
  erros: { loteId: string; erro: string }[];
}

interface LoteParaSync {
  id: string;
  drive_folder_id: string;
}

/**
 * Sincroniza arquivos do Google Drive para os documentos dos lotes.
 *
 * Para cada lote com `drive_folder_id`, lista os arquivos da pasta e insere em
 * `documentos` os que ainda não foram importados (comparando por drive_file_id).
 * Nunca duplica (índice único parcial em drive_file_id é a blindagem final).
 *
 * Idempotente: rodar várias vezes não cria duplicatas.
 *
 * @param loteId  se informado, sincroniza só esse lote ("sincronizar agora").
 */
export async function syncDrive(loteId?: string): Promise<SyncResult> {
  if (!isDriveConfigured()) throw new DriveNotConfiguredError();

  const supabase = createAdminClient();
  const result: SyncResult = {
    lotesVerificados: 0,
    arquivosImportados: 0,
    erros: [],
  };

  let query = supabase
    .from("lotes")
    .select("id, drive_folder_id")
    .not("drive_folder_id", "is", null);
  if (loteId) query = query.eq("id", loteId);

  const { data: lotes, error } = await query;
  if (error) throw new Error(`Erro ao buscar lotes: ${error.message}`);

  for (const lote of (lotes ?? []) as LoteParaSync[]) {
    if (!lote.drive_folder_id) continue;
    result.lotesVerificados++;
    try {
      const arquivos = await listFilesInFolder(lote.drive_folder_id);
      if (arquivos.length === 0) continue;

      // IDs do Drive já importados para este lote.
      const { data: existentes } = await supabase
        .from("documentos")
        .select("drive_file_id")
        .eq("entidade_tipo", "lote")
        .eq("entidade_id", lote.id)
        .not("drive_file_id", "is", null);
      const jaImportados = new Set(
        (existentes ?? [])
          .map((d) => d.drive_file_id)
          .filter((x): x is string => Boolean(x)),
      );

      const novos = arquivos.filter((a) => !jaImportados.has(a.id));
      if (novos.length === 0) continue;

      const linhas = novos.map((a) => ({
        entidade_tipo: "lote" as const,
        entidade_id: lote.id,
        nome: a.name,
        etapa: null,
        arquivo_url: a.webViewLink,
        origem: "drive",
        drive_file_id: a.id,
      }));

      // upsert ignorando conflito no índice único (corrida entre cron e botão).
      const { error: insErr, count } = await supabase
        .from("documentos")
        .upsert(linhas, {
          onConflict: "drive_file_id",
          ignoreDuplicates: true,
          count: "exact",
        });
      if (insErr) throw new Error(insErr.message);
      result.arquivosImportados += count ?? novos.length;
    } catch (err) {
      result.erros.push({
        loteId: lote.id,
        erro: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
