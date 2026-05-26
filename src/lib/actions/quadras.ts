"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const quadraSchema = z.object({
  loteamento_id: z.string().uuid(),
  identificador: z.string().min(1, "Identificador obrigatório"),
  descricao: z.string().optional().nullable(),
  imagem_url: z.string().optional().nullable(),
});

export type QuadraInput = z.infer<typeof quadraSchema>;

export async function createQuadra(input: QuadraInput) {
  const parsed = quadraSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quadras")
    .insert(parsed)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/loteamentos/${parsed.loteamento_id}`);
  redirect(`/loteamentos/${parsed.loteamento_id}/quadras/${data.id}`);
}

export async function updateQuadra(id: string, input: Partial<QuadraInput>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quadras")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/loteamentos/${data.loteamento_id}`);
  revalidatePath(`/loteamentos/${data.loteamento_id}/quadras/${id}`);
}

export async function deleteQuadra(id: string) {
  const supabase = await createClient();
  const { data: quadra } = await supabase
    .from("quadras")
    .select("loteamento_id")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("quadras").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (quadra) {
    revalidatePath(`/loteamentos/${quadra.loteamento_id}`);
    redirect(`/loteamentos/${quadra.loteamento_id}`);
  }
}
