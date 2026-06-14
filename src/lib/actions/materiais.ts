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

export async function addLancamentoMaterial(input: LancamentoInput) {
  const parsed = lancamentoSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("lancamentos_material")
    .insert(clean(parsed as Record<string, unknown>));
  if (error) throw new Error(error.message);

  // Atualizar gasto da fase se atrelado
  if (parsed.fase_id && parsed.tipo === "saida") {
    const { data: fase } = await supabase
      .from("fases_obra")
      .select("gasto")
      .eq("id", parsed.fase_id)
      .single();
    if (fase) {
      await supabase
        .from("fases_obra")
        .update({ gasto: Number(fase.gasto ?? 0) + Number(parsed.valor_total) })
        .eq("id", parsed.fase_id);
    }
  }

  revalidatePath(`/lotes/${parsed.lote_id}`);
  revalidatePath("/relatorios");
  revalidatePath("/");
}

export async function updateLancamentoMaterial(
  id: string,
  input: Partial<LancamentoInput>,
) {
  const supabase = await createClient();
  // Snapshot do lançamento antes da alteração (para ajustar gasto da fase)
  const { data: anterior } = await supabase
    .from("lancamentos_material")
    .select("fase_id, tipo, valor_total")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("lancamentos_material")
    .update(clean(input as Record<string, unknown>))
    .eq("id", id)
    .select("lote_id, fase_id, tipo, valor_total")
    .single();
  if (error) throw new Error(error.message);

  if (anterior && data) {
    // Subtrai o valor antigo da fase original
    if (anterior.fase_id && anterior.tipo === "saida") {
      const { data: faseAnt } = await supabase
        .from("fases_obra")
        .select("gasto")
        .eq("id", anterior.fase_id)
        .single();
      if (faseAnt) {
        await supabase
          .from("fases_obra")
          .update({
            gasto: Math.max(
              0,
              Number(faseAnt.gasto ?? 0) - Number(anterior.valor_total),
            ),
          })
          .eq("id", anterior.fase_id);
      }
    }
    // Adiciona o novo valor na fase atual (pode ter mudado)
    if (data.fase_id && data.tipo === "saida") {
      const { data: faseNova } = await supabase
        .from("fases_obra")
        .select("gasto")
        .eq("id", data.fase_id)
        .single();
      if (faseNova) {
        await supabase
          .from("fases_obra")
          .update({
            gasto:
              Number(faseNova.gasto ?? 0) + Number(data.valor_total),
          })
          .eq("id", data.fase_id);
      }
    }
  }

  if (data) revalidatePath(`/lotes/${data.lote_id}`);
  revalidatePath("/relatorios");
  revalidatePath("/");
}

export async function deleteLancamento(id: string, loteId: string) {
  const supabase = await createClient();
  const { data: lanc } = await supabase
    .from("lancamentos_material")
    .select("fase_id, tipo, valor_total")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("lancamentos_material")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (lanc?.fase_id && lanc.tipo === "saida") {
    const { data: fase } = await supabase
      .from("fases_obra")
      .select("gasto")
      .eq("id", lanc.fase_id)
      .single();
    if (fase) {
      await supabase
        .from("fases_obra")
        .update({
          gasto: Math.max(
            0,
            Number(fase.gasto ?? 0) - Number(lanc.valor_total),
          ),
        })
        .eq("id", lanc.fase_id);
    }
  }
  revalidatePath(`/lotes/${loteId}`);
  revalidatePath("/relatorios");
  revalidatePath("/");
}
