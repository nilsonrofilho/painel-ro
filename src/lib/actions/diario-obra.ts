"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const diarioSchema = z.object({
  lote_id: z.string().uuid(),
  data: z.string().min(1, "Data obrigatória"),
  responsavel_id: z.string().uuid().optional().nullable(),
  total_efetivo: z.coerce.number().int().min(0).default(0),
  presentes: z.coerce.number().int().min(0).default(0),
  ausentes: z.coerce.number().int().min(0).default(0),
  atividades_executadas: z.coerce.number().int().min(0).default(0),
  clima: z
    .enum([
      "ensolarado",
      "nublado",
      "chuvoso",
      "parcialmente_nublado",
      "garoa",
    ])
    .optional()
    .nullable(),
  resumo_atividades: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
  fotos: z.array(z.string()).default([]),
});

export type DiarioInput = z.infer<typeof diarioSchema>;

function clean<T extends Record<string, unknown>>(d: T): T {
  return Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

export async function addDiarioObra(input: DiarioInput) {
  const parsed = diarioSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("diarios_obra")
    .insert(clean(parsed as Record<string, unknown>));
  if (error) {
    if (error.code === "23505") {
      throw new Error("Já existe um diário para este lote nesta data.");
    }
    throw new Error(error.message);
  }
  revalidatePath(`/lotes/${parsed.lote_id}`);
}

export async function updateDiarioObra(
  id: string,
  input: Partial<DiarioInput>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("diarios_obra")
    .update(clean(input as Record<string, unknown>))
    .eq("id", id)
    .select("lote_id")
    .single();
  if (error) throw new Error(error.message);
  if (data) revalidatePath(`/lotes/${data.lote_id}`);
}

export async function deleteDiarioObra(id: string, loteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("diarios_obra").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/lotes/${loteId}`);
}
