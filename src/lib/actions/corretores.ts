"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const corretorSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  creci: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  comissao_padrao_pct: z.coerce.number().optional().nullable(),
});

export type CorretorInput = z.infer<typeof corretorSchema>;

function clean<T extends Record<string, unknown>>(d: T): T {
  return Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

export async function createCorretor(input: CorretorInput) {
  const parsed = corretorSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .insert(clean(parsed));
  if (error) throw new Error(error.message);
  revalidatePath("/corretores");
  redirect("/corretores");
}

export async function updateCorretor(id: string, input: CorretorInput) {
  const parsed = corretorSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("corretores")
    .update(clean(parsed))
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/corretores");
}

export async function deleteCorretor(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("corretores").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/corretores");
}
