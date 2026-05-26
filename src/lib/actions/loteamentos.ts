"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loteamentoSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  imagem_url: z.string().optional().nullable(),
  data_inicio: z.string().optional().nullable(),
  previsao_entrega: z.string().optional().nullable(),
  responsavel_id: z.string().uuid().optional().nullable(),
  status: z
    .enum(["planejamento", "em_obra", "concluido", "pausado"])
    .default("planejamento"),
  descricao: z.string().optional().nullable(),
});

export type LoteamentoInput = z.infer<typeof loteamentoSchema>;

function clean<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

export async function createLoteamento(input: LoteamentoInput) {
  const parsed = loteamentoSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loteamentos")
    .insert(clean(parsed))
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/loteamentos");
  revalidatePath("/");
  redirect(`/loteamentos/${data.id}`);
}

export async function updateLoteamento(id: string, input: LoteamentoInput) {
  const parsed = loteamentoSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("loteamentos")
    .update(clean(parsed))
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/loteamentos");
  revalidatePath(`/loteamentos/${id}`);
  revalidatePath("/");
}

export async function deleteLoteamento(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("loteamentos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/loteamentos");
  revalidatePath("/");
  redirect("/loteamentos");
}
