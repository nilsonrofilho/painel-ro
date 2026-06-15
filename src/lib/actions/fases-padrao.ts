"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const configSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  ordem: z.coerce.number().int().default(0),
  duracao_dias: z.coerce.number().int().min(0).default(15),
});

export type FasePadraoInput = z.infer<typeof configSchema>;

function revalidar() {
  revalidatePath("/parametros");
  revalidatePath("/fases-obra");
}

export async function addFasePadrao(input: FasePadraoInput) {
  const parsed = configSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("fases_padrao_config").insert(parsed);
  if (error) throw new Error(error.message);
  revalidar();
}

export async function updateFasePadrao(
  id: string,
  input: Partial<FasePadraoInput>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fases_padrao_config")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}

export async function deleteFasePadrao(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fases_padrao_config")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}
