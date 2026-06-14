"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const lancamentoSchema = z.object({
  lote_id: z.string().uuid(),
  fase_id: z.string().uuid().optional().nullable(),
  material_id: z.string().uuid().optional().nullable(),
  tipo: z.enum(["entrada", "saida"]),
  data: z.string(),
  material: z.string().min(1, "Material obrigatório"),
  quantidade: z.coerce.number().min(0),
  unidade: z.string().optional().nullable(),
  valor_unitario: z.coerce.number().optional().nullable(),
  valor_total: z.coerce.number().min(0),
  fornecedor_id: z.string().uuid().optional().nullable(),
  nota_fiscal_numero: z.string().optional().nullable(),
  nota_fiscal_url: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export type LancamentoInput = z.infer<typeof lancamentoSchema>;

function clean<T extends Record<string, unknown>>(d: T): T {
  return Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

// O gasto da fase é mantido automaticamente pelo trigger
// `lancamento_material_gasto` (migration 0006). As actions só persistem o
// lançamento — sem read-modify-write manual, sem race condition.

function revalidar(loteId: string) {
  revalidatePath(`/lotes/${loteId}`);
  revalidatePath("/relatorios");
  revalidatePath("/gantt");
  revalidatePath("/");
}

export async function addLancamentoMaterial(input: LancamentoInput) {
  const parsed = lancamentoSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("lancamentos_material")
    .insert(clean(parsed as Record<string, unknown>));
  if (error) throw new Error(error.message);
  revalidar(parsed.lote_id);
}

export async function updateLancamentoMaterial(
  id: string,
  input: Partial<LancamentoInput>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lancamentos_material")
    .update(clean(input as Record<string, unknown>))
    .eq("id", id)
    .select("lote_id")
    .single();
  if (error) throw new Error(error.message);
  if (data) revalidar(data.lote_id);
}

export async function deleteLancamento(id: string, loteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lancamentos_material")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar(loteId);
}
