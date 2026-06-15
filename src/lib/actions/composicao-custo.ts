"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  fase_id: z.string().uuid(),
  material_id: z.string().uuid().optional().nullable(),
  descricao: z.string().min(1, "Descrição obrigatória"),
  unidade: z.string().optional().nullable(),
  quantidade: z.coerce.number().min(0).default(1),
  valor_unitario: z.coerce.number().min(0).default(0),
  ordem: z.coerce.number().int().default(0),
});

export type ItemComposicaoInput = z.infer<typeof itemSchema>;

function clean<T extends Record<string, unknown>>(d: T): T {
  return Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

function revalidar(loteId: string) {
  revalidatePath(`/lotes/${loteId}`);
  revalidatePath("/relatorios");
  revalidatePath("/gantt");
}

export async function addItemComposicao(
  input: ItemComposicaoInput,
  loteId: string,
) {
  const parsed = itemSchema.parse(input);
  const supabase = await createClient();
  const valorTotal = Number(parsed.quantidade) * Number(parsed.valor_unitario);
  const { error } = await supabase.from("composicao_custo").insert({
    ...clean(parsed as Record<string, unknown>),
    valor_total: valorTotal,
  });
  if (error) throw new Error(error.message);
  revalidar(loteId);
}

export async function updateItemComposicao(
  id: string,
  loteId: string,
  input: Partial<ItemComposicaoInput>,
) {
  const supabase = await createClient();
  const patch = clean(input as Record<string, unknown>);
  // Recalcula total se qtd ou unitário mudaram
  if (input.quantidade != null || input.valor_unitario != null) {
    const { data: atual } = await supabase
      .from("composicao_custo")
      .select("quantidade, valor_unitario")
      .eq("id", id)
      .single();
    const q = input.quantidade ?? atual?.quantidade ?? 0;
    const vu = input.valor_unitario ?? atual?.valor_unitario ?? 0;
    patch.valor_total = Number(q) * Number(vu);
  }
  const { error } = await supabase
    .from("composicao_custo")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar(loteId);
}

export async function deleteItemComposicao(id: string, loteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("composicao_custo")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar(loteId);
}
