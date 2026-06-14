"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

function clean<T extends Record<string, unknown>>(d: T): T {
  return Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

const investidorSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cpf_cnpj: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
});

export type InvestidorInput = z.infer<typeof investidorSchema>;

export async function createInvestidor(input: InvestidorInput) {
  const parsed = investidorSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investidores")
    .insert(clean(parsed as Record<string, unknown>))
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/investidores");
  redirect(`/investidores/${data.id}`);
}

export async function updateInvestidor(id: string, input: InvestidorInput) {
  const parsed = investidorSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("investidores")
    .update(clean(parsed as Record<string, unknown>))
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/investidores");
  revalidatePath(`/investidores/${id}`);
}

export async function deleteInvestidor(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("investidores").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/investidores");
  redirect("/investidores");
}

/** Gera um novo token público (revoga o link de acompanhamento anterior). */
export async function regenerarToken(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("investidores")
    .update({ token_publico: crypto.randomUUID() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/investidores/${id}`);
}

// ============================================================
// Aportes
// ============================================================
const aporteSchema = z.object({
  investidor_id: z.string().uuid(),
  lote_id: z.string().uuid(),
  valor_investido: z.coerce.number().min(0),
  retorno_pct: z.coerce.number().optional().nullable(),
  retorno_valor: z.coerce.number().optional().nullable(),
  data_aporte: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export async function addAporte(input: z.infer<typeof aporteSchema>) {
  const parsed = aporteSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("aportes")
    .insert(clean(parsed as Record<string, unknown>));
  if (error) {
    if (error.code === "23505")
      throw new Error("Este investidor já tem um aporte neste lote.");
    throw new Error(error.message);
  }
  revalidatePath(`/investidores/${parsed.investidor_id}`);
}

export async function updateAporte(
  id: string,
  investidorId: string,
  input: Partial<z.infer<typeof aporteSchema>>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("aportes")
    .update(clean(input as Record<string, unknown>))
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/investidores/${investidorId}`);
}

export async function deleteAporte(id: string, investidorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("aportes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/investidores/${investidorId}`);
}
