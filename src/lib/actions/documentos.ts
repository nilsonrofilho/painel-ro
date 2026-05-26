"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const docSchema = z.object({
  entidade_tipo: z.enum(["lote", "loteamento", "funcionario", "venda"]),
  entidade_id: z.string().uuid(),
  nome: z.string().min(1),
  etapa: z.string().optional().nullable(),
  arquivo_url: z.string().url(),
});

export type DocumentoInput = z.infer<typeof docSchema>;

export async function addDocumento(input: DocumentoInput) {
  const parsed = docSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("documentos").insert(parsed);
  if (error) throw new Error(error.message);
  if (parsed.entidade_tipo === "lote") {
    revalidatePath(`/lotes/${parsed.entidade_id}`);
  } else if (parsed.entidade_tipo === "loteamento") {
    revalidatePath(`/loteamentos/${parsed.entidade_id}`);
  } else if (parsed.entidade_tipo === "funcionario") {
    revalidatePath(`/funcionarios/${parsed.entidade_id}`);
  }
}

export async function deleteDocumento(
  id: string,
  entidadeTipo: string,
  entidadeId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("documentos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (entidadeTipo === "lote") revalidatePath(`/lotes/${entidadeId}`);
  if (entidadeTipo === "loteamento")
    revalidatePath(`/loteamentos/${entidadeId}`);
  if (entidadeTipo === "funcionario")
    revalidatePath(`/funcionarios/${entidadeId}`);
}
