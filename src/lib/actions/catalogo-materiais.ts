"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const materialSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  unidade: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  preco_referencia: z.coerce.number().optional().nullable(),
  estoque_minimo: z.coerce.number().optional().nullable(),
  observacao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
});

export type MaterialInput = z.infer<typeof materialSchema>;

function clean<T extends Record<string, unknown>>(d: T): T {
  return Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

export async function createMaterial(input: MaterialInput) {
  const parsed = materialSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("materiais")
    .insert(clean(parsed as Record<string, unknown>));
  if (error) throw new Error(error.message);
  revalidatePath("/materiais");
  redirect("/materiais");
}

export async function updateMaterial(id: string, input: MaterialInput) {
  const parsed = materialSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("materiais")
    .update(clean(parsed as Record<string, unknown>))
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/materiais");
}

export async function deleteMaterial(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("materiais").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/materiais");
}

export async function toggleMaterialAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("materiais")
    .update({ ativo })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/materiais");
}
