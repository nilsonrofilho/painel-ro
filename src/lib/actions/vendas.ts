"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const vendaSchema = z.object({
  lote_id: z.string().uuid(),
  tipo: z.enum(["reserva", "venda"]),
  cliente_nome: z.string().optional().nullable(),
  cliente_cpf: z.string().optional().nullable(),
  cliente_telefone: z.string().optional().nullable(),
  cliente_email: z.string().optional().nullable(),
  cliente_nascimento: z.string().optional().nullable(),
  corretor_id: z.string().uuid().optional().nullable(),
  comissao_pct: z.coerce.number().optional().nullable(),
  comissao_valor: z.coerce.number().optional().nullable(),
  valor: z.coerce.number().optional().nullable(),
  valor_sinal: z.coerce.number().optional().nullable(),
  forma_pagamento: z.string().optional().nullable(),
  data: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export type VendaInput = z.infer<typeof vendaSchema>;

function clean<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

export async function reservarLote(input: VendaInput) {
  const parsed = vendaSchema.parse({ ...input, tipo: "reserva" });
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendas")
    .insert({ ...clean(parsed), status: "ativa" });
  if (error) throw new Error(error.message);
  await supabase
    .from("lotes")
    .update({ status: "reservado" })
    .eq("id", parsed.lote_id);
  revalidatePath(`/lotes/${parsed.lote_id}`);
  revalidatePath("/");
}

export async function venderLote(input: VendaInput) {
  const parsed = vendaSchema.parse({ ...input, tipo: "venda" });
  const supabase = await createClient();

  // converter reservas ativas em "convertida"
  await supabase
    .from("vendas")
    .update({ status: "convertida" })
    .eq("lote_id", parsed.lote_id)
    .eq("tipo", "reserva")
    .eq("status", "ativa");

  const { error } = await supabase
    .from("vendas")
    .insert({ ...clean(parsed), status: "ativa" });
  if (error) throw new Error(error.message);

  const update: { status: "vendido"; valor_venda?: number } = { status: "vendido" };
  if (parsed.valor != null) update.valor_venda = Number(parsed.valor);
  await supabase.from("lotes").update(update).eq("id", parsed.lote_id);

  revalidatePath(`/lotes/${parsed.lote_id}`);
  revalidatePath("/");
}

export async function updateVenda(
  vendaId: string,
  input: Partial<Omit<VendaInput, "lote_id" | "tipo">>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendas")
    .update(clean(input as Record<string, unknown>))
    .eq("id", vendaId)
    .select("lote_id, tipo, valor, status")
    .single();
  if (error) throw new Error(error.message);
  if (data) {
    // Se for venda ativa, sincroniza valor_venda do lote com o valor mais recente
    if (data.tipo === "venda" && data.status === "ativa" && data.valor != null) {
      await supabase
        .from("lotes")
        .update({ valor_venda: Number(data.valor) })
        .eq("id", data.lote_id);
    }
    revalidatePath(`/lotes/${data.lote_id}`);
    revalidatePath("/");
  }
}

export async function cancelarVenda(vendaId: string) {
  const supabase = await createClient();
  const { data: venda, error: e1 } = await supabase
    .from("vendas")
    .update({ status: "cancelada" })
    .eq("id", vendaId)
    .select("lote_id, tipo")
    .single();
  if (e1) throw new Error(e1.message);
  if (venda) {
    // Recalcula status do lote: se nenhuma venda/reserva ativa, volta a "disponivel"
    const { data: ativas } = await supabase
      .from("vendas")
      .select("tipo")
      .eq("lote_id", venda.lote_id)
      .eq("status", "ativa");
    let novoStatus: "disponivel" | "reservado" | "vendido" = "disponivel";
    if (ativas?.some((v) => v.tipo === "venda")) novoStatus = "vendido";
    else if (ativas?.some((v) => v.tipo === "reserva")) novoStatus = "reservado";
    await supabase
      .from("lotes")
      .update({ status: novoStatus })
      .eq("id", venda.lote_id);
    revalidatePath(`/lotes/${venda.lote_id}`);
    revalidatePath("/");
  }
}
