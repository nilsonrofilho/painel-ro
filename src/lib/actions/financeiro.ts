"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

function clean<T extends Record<string, unknown>>(d: T): T {
  return Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

function revalidar() {
  revalidatePath("/financeiro");
  revalidatePath("/");
}

const lancamentoSchema = z.object({
  tipo: z.enum(["pagar", "receber"]),
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.coerce.number().min(0),
  data_vencimento: z.string().min(1, "Vencimento obrigatório"),
  data_competencia: z.string().optional().nullable(),
  categoria: z
    .enum([
      "obra",
      "terreno",
      "administrativo",
      "marketing",
      "comissao",
      "imposto",
      "financeiro",
      "venda",
      "outro",
    ])
    .default("outro"),
  loteamento_id: z.string().uuid().optional().nullable(),
  lote_id: z.string().uuid().optional().nullable(),
  fornecedor_id: z.string().uuid().optional().nullable(),
  corretor_id: z.string().uuid().optional().nullable(),
  forma_pagamento: z
    .enum(["pix", "boleto", "transferencia", "dinheiro", "cartao"])
    .optional()
    .nullable(),
  nota_fiscal_numero: z.string().optional().nullable(),
  comprovante_url: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
  recorrencia: z.enum(["none", "mensal", "semanal", "anual"]).default("none"),
  parcelas: z.coerce.number().int().min(1).default(1),
});

export type LancamentoFinInput = z.infer<typeof lancamentoSchema>;

function addPeriodo(dataISO: string, recorrencia: string, n: number): string {
  const d = new Date(dataISO + "T00:00:00");
  if (recorrencia === "mensal") d.setMonth(d.getMonth() + n);
  else if (recorrencia === "semanal") d.setDate(d.getDate() + 7 * n);
  else if (recorrencia === "anual") d.setFullYear(d.getFullYear() + n);
  return d.toISOString().slice(0, 10);
}

export async function createLancamento(input: LancamentoFinInput) {
  const parsed = lancamentoSchema.parse(input);
  const supabase = await createClient();
  const { parcelas, recorrencia, ...base } = parsed;

  // Materializa parcelas/recorrência se aplicável
  const totalLinhas =
    recorrencia !== "none" && parcelas > 1 ? parcelas : 1;
  const grupoId =
    totalLinhas > 1 ? crypto.randomUUID() : null;

  const linhas = Array.from({ length: totalLinhas }, (_, i) => {
    const venc =
      totalLinhas > 1
        ? addPeriodo(base.data_vencimento, recorrencia, i)
        : base.data_vencimento;
    return clean({
      ...base,
      data_vencimento: venc,
      recorrencia,
      grupo_id: grupoId,
      parcela_numero: totalLinhas > 1 ? i + 1 : null,
      total_parcelas: totalLinhas > 1 ? totalLinhas : null,
      status: "pendente" as const,
    } as Record<string, unknown>);
  });

  const { error } = await supabase
    .from("lancamentos_financeiros")
    .insert(linhas);
  if (error) throw new Error(error.message);
  revalidar();
}

export async function updateLancamento(
  id: string,
  input: Partial<Omit<LancamentoFinInput, "parcelas" | "recorrencia">>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lancamentos_financeiros")
    .update({
      ...clean(input as Record<string, unknown>),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}

/** Baixa o pagamento: marca como pago, data e valor pago. */
export async function baixarPagamento(
  id: string,
  dados: { data_pagamento: string; valor_pago: number; forma_pagamento?: string | null },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lancamentos_financeiros")
    .update({
      status: "pago",
      data_pagamento: dados.data_pagamento,
      valor_pago: dados.valor_pago,
      forma_pagamento: dados.forma_pagamento || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}

/** Reabre um lançamento pago (volta a pendente). */
export async function reabrirLancamento(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lancamentos_financeiros")
    .update({
      status: "pendente",
      data_pagamento: null,
      valor_pago: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}

export async function deleteLancamento(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lancamentos_financeiros")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}
