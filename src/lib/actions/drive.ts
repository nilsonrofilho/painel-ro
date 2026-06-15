"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseFolderId, isDriveConfigured } from "@/lib/google-drive";
import { syncDrive } from "@/lib/drive-sync";

/**
 * Vincula (ou desvincula, com input vazio) a pasta do Google Drive a um lote.
 * Aceita o ID puro ou a URL da pasta.
 */
export async function vincularPastaDrive(loteId: string, input: string) {
  const folderId = input.trim() ? parseFolderId(input) : null;
  if (input.trim() && !folderId) {
    throw new Error(
      "Link/ID da pasta inválido. Cole o link da pasta do Google Drive.",
    );
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("lotes")
    .update({ drive_folder_id: folderId })
    .eq("id", loteId);
  if (error) throw new Error(error.message);
  revalidatePath(`/lotes/${loteId}`);
  return { folderId };
}

/**
 * Sincroniza agora os arquivos do Drive para este lote (botão "Sincronizar
 * agora"). Retorna quantos foram importados para feedback imediato.
 */
export async function sincronizarLoteAgora(loteId: string) {
  if (!isDriveConfigured()) {
    throw new Error(
      "Google Drive ainda não configurado no servidor. Avise o administrador.",
    );
  }
  const resultado = await syncDrive(loteId);
  revalidatePath(`/lotes/${loteId}`);
  if (resultado.erros.length > 0) {
    throw new Error(resultado.erros[0].erro);
  }
  return { importados: resultado.arquivosImportados };
}
