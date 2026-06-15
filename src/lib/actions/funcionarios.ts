"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const funcionarioSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),
  funcao: z.string().optional().nullable(),
  tipo_contratacao: z
    .enum(["clt", "diarista", "empreitada"])
    .optional()
    .nullable(),
  salario: z.coerce.number().optional().nullable(),
  diaria: z.coerce.number().optional().nullable(),
  telefone: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  data_admissao: z.string().optional().nullable(),
  data_nascimento: z.string().optional().nullable(),
  foto_url: z.string().optional().nullable(),
  status: z.enum(["ativo", "inativo"]).default("ativo"),
});

export type FuncionarioInput = z.infer<typeof funcionarioSchema>;

function clean<T extends Record<string, unknown>>(d: T): T {
  return Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

export async function createFuncionario(input: FuncionarioInput) {
  const parsed = funcionarioSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funcionarios")
    .insert(clean(parsed))
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/funcionarios");
  redirect(`/funcionarios/${data.id}`);
}

export async function updateFuncionario(id: string, input: FuncionarioInput) {
  const parsed = funcionarioSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("funcionarios")
    .update(clean(parsed))
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/funcionarios");
  revalidatePath(`/funcionarios/${id}`);
}

export async function deleteFuncionario(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("funcionarios").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/funcionarios");
  redirect("/funcionarios");
}

const alocacaoSchema = z.object({
  funcionario_id: z.string().uuid(),
  lote_id: z.string().uuid(),
  funcao_no_lote: z.string().optional().nullable(),
  data_inicio: z.string().optional().nullable(),
  data_fim: z.string().optional().nullable(),
  valor_pago: z.coerce.number().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export async function addAlocacao(input: z.infer<typeof alocacaoSchema>) {
  const parsed = alocacaoSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("alocacoes")
    .insert(clean(parsed as Record<string, unknown>));
  if (error) throw new Error(error.message);
  revalidatePath(`/lotes/${parsed.lote_id}`);
  revalidatePath(`/funcionarios/${parsed.funcionario_id}`);
}

export async function updateAlocacao(
  id: string,
  input: Partial<z.infer<typeof alocacaoSchema>>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alocacoes")
    .update(clean(input as Record<string, unknown>))
    .eq("id", id)
    .select("lote_id, funcionario_id")
    .single();
  if (error) throw new Error(error.message);
  if (data) {
    revalidatePath(`/lotes/${data.lote_id}`);
    revalidatePath(`/funcionarios/${data.funcionario_id}`);
  }
}

export async function deleteAlocacao(id: string, loteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("alocacoes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/lotes/${loteId}`);
}
