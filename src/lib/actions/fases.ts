"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const faseSchema = z.object({
  lote_id: z.string().uuid(),
  nome: z.string().min(1),
  orcamento: z.coerce.number().optional().nullable(),
  data_inicio: z.string().optional().nullable(),
  data_fim: z.string().optional().nullable(),
  status: z
    .enum(["pendente", "em_andamento", "concluida"])
    .default("pendente"),
  ordem: z.coerce.number().int().default(0),
});

export type FaseInput = z.infer<typeof faseSchema>;

function clean<T extends Record<string, unknown>>(d: T): T {
  return Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

export async function addFase(input: FaseInput) {
  const parsed = faseSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("fases_obra")
    .insert({ ...clean(parsed as Record<string, unknown>), gasto: 0 });
  if (error) throw new Error(error.message);
  revalidatePath(`/lotes/${parsed.lote_id}`);
  revalidatePath("/gantt");
}

export async function updateFase(id: string, input: Partial<FaseInput>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fases_obra")
    .update(clean(input as Record<string, unknown>))
    .eq("id", id)
    .select("lote_id")
    .single();
  if (error) throw new Error(error.message);
  if (data) revalidatePath(`/lotes/${data.lote_id}`);
  revalidatePath("/gantt");
}

export async function deleteFase(id: string, loteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fases_obra").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/lotes/${loteId}`);
  revalidatePath("/gantt");
}

export async function seedFasesPadrao(loteId: string) {
  const supabase = await createClient();
  const padrao = [
    { nome: "Fundação", ordem: 1 },
    { nome: "Alvenaria", ordem: 2 },
    { nome: "Cobertura", ordem: 3 },
    { nome: "Instalações", ordem: 4 },
    { nome: "Acabamento", ordem: 5 },
  ];
  await supabase.from("fases_obra").insert(
    padrao.map((p) => ({
      lote_id: loteId,
      nome: p.nome,
      ordem: p.ordem,
      gasto: 0,
      status: "pendente" as const,
    })),
  );
  revalidatePath(`/lotes/${loteId}`);
}
