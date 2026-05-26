"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const fornecedorSchema = z.object({
  razao_social: z.string().min(2, "Razão social obrigatória"),
  nome_fantasia: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  categoria: z.enum(["material", "servico", "ambos"]).default("material"),
  observacao: z.string().optional().nullable(),
});

export type FornecedorInput = z.infer<typeof fornecedorSchema>;

function clean<T extends Record<string, unknown>>(d: T): T {
  return Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

export async function createFornecedor(input: FornecedorInput) {
  const parsed = fornecedorSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fornecedores")
    .insert(clean(parsed))
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/fornecedores");
  redirect(`/fornecedores/${data.id}`);
}

export async function updateFornecedor(id: string, input: FornecedorInput) {
  const parsed = fornecedorSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("fornecedores")
    .update(clean(parsed))
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/fornecedores");
  revalidatePath(`/fornecedores/${id}`);
}

export async function deleteFornecedor(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fornecedores").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/fornecedores");
  redirect("/fornecedores");
}

const precoSchema = z.object({
  fornecedor_id: z.string().uuid(),
  material: z.string().min(1),
  unidade: z.string().optional().nullable(),
  preco: z.coerce.number().min(0),
});

export async function addFornecedorPreco(input: z.infer<typeof precoSchema>) {
  const parsed = precoSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("fornecedor_precos").insert(parsed);
  if (error) throw new Error(error.message);
  revalidatePath(`/fornecedores/${parsed.fornecedor_id}`);
}

export async function deleteFornecedorPreco(id: string, fornecedorId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fornecedor_precos")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/fornecedores/${fornecedorId}`);
}
