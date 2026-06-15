"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  DURACOES_PADRAO_FASE,
  calcularCronograma,
  type FaseCronograma,
} from "@/lib/cronograma";

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
  predecessora_id: z.string().uuid().optional().nullable(),
  duracao_dias: z.coerce.number().int().optional().nullable(),
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
  revalidatePath("/fases-obra");
  revalidatePath("/gantt");
  revalidatePath("/relatorios");
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
  revalidatePath("/fases-obra");
  revalidatePath("/gantt");
  revalidatePath("/relatorios");
}

export async function deleteFase(id: string, loteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fases_obra").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/lotes/${loteId}`);
  revalidatePath("/fases-obra");
  revalidatePath("/gantt");
  revalidatePath("/relatorios");
}

const FASES_PADRAO = [
  "Planejamento",
  "Serviços preliminares",
  "Fundação",
  "Alvenaria",
  "Cobertura",
  "Acabamento",
  "Concluído",
  "Documentação Final",
] as const;

/**
 * Lê o modelo de fases padrão configurado no banco (tabela editável em
 * Parâmetros). Se a tabela estiver vazia ou não existir ainda (migration 0015
 * não aplicada), cai no modelo hardcoded — assim a feature nunca quebra.
 */
async function getModeloFasesPadrao(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ nome: string; duracao_dias: number | null }[]> {
  const { data, error } = await supabase
    .from("fases_padrao_config")
    .select("nome, ordem, duracao_dias")
    .order("ordem");
  if (!error && data && data.length > 0) {
    return data.map((f) => ({ nome: f.nome, duracao_dias: f.duracao_dias }));
  }
  return FASES_PADRAO.map((nome) => ({
    nome,
    duracao_dias: DURACOES_PADRAO_FASE[nome] ?? null,
  }));
}

export async function seedFasesPadrao(loteId: string) {
  const supabase = await createClient();
  const modelo = await getModeloFasesPadrao(supabase);

  // 1) Insere as fases padrão (do modelo configurado) com suas durações.
  const { data: inseridas, error } = await supabase
    .from("fases_obra")
    .insert(
      modelo.map((m, i) => ({
        lote_id: loteId,
        nome: m.nome,
        ordem: i + 1,
        gasto: 0,
        status: "pendente" as const,
        duracao_dias: m.duracao_dias,
      })),
    )
    .select("id, nome, ordem, duracao_dias, predecessora_id, data_inicio, data_fim");
  if (error) throw new Error(error.message);

  const fases = (inseridas ?? []) as FaseCronograma[];
  const ordenadas = [...fases].sort((a, b) => a.ordem - b.ordem);

  // 2) Encadeia: cada fase tem como predecessora a anterior (cadeia linear).
  for (let i = 1; i < ordenadas.length; i++) {
    ordenadas[i].predecessora_id = ordenadas[i - 1].id;
    await supabase
      .from("fases_obra")
      .update({ predecessora_id: ordenadas[i - 1].id })
      .eq("id", ordenadas[i].id);
  }

  // 3) Se o lote tem data de início da obra, já grava o cronograma calculado.
  const { data: lote } = await supabase
    .from("lotes")
    .select("data_inicio_obra")
    .eq("id", loteId)
    .single();
  const inicioObra = (lote?.data_inicio_obra as string | null) ?? null;
  if (inicioObra) {
    const datas = calcularCronograma(ordenadas, inicioObra);
    for (const d of datas) {
      await supabase
        .from("fases_obra")
        .update({ data_inicio: d.data_inicio, data_fim: d.data_fim })
        .eq("id", d.id);
    }
  }

  revalidatePath(`/lotes/${loteId}`);
  revalidatePath("/fases-obra");
  revalidatePath("/gantt");
  revalidatePath("/relatorios");
}

/**
 * Aplica as fases padrão a VÁRIOS lotes de uma vez (edição em massa). Pula
 * lotes que já têm fases para não duplicar. Retorna quantos foram semeados.
 */
export async function seedFasesPadraoEmMassa(loteIds: string[]) {
  const supabase = await createClient();
  let aplicados = 0;
  for (const loteId of loteIds) {
    const { count } = await supabase
      .from("fases_obra")
      .select("id", { count: "exact", head: true })
      .eq("lote_id", loteId);
    if ((count ?? 0) > 0) continue; // já tem fases
    await seedFasesPadrao(loteId);
    aplicados++;
  }
  revalidatePath("/fases-obra");
  revalidatePath("/gantt");
  return { aplicados };
}

/**
 * Recalcula o cronograma de um lote: encadeia as datas das fases pelas durações
 * a partir da data de início da obra (ou da menor data já preenchida) e GRAVA
 * data_inicio/data_fim em cada fase.
 */
export async function recalcularCronograma(loteId: string) {
  const supabase = await createClient();
  const [{ data: fases }, { data: lote }] = await Promise.all([
    supabase
      .from("fases_obra")
      .select("id, nome, ordem, duracao_dias, predecessora_id, data_inicio, data_fim")
      .eq("lote_id", loteId),
    supabase.from("lotes").select("data_inicio_obra").eq("id", loteId).single(),
  ]);
  const lista = (fases ?? []) as FaseCronograma[];
  if (lista.length === 0) {
    throw new Error("Cadastre as fases antes de recalcular o cronograma.");
  }
  const inicioObra = (lote?.data_inicio_obra as string | null) ?? null;
  const datas = calcularCronograma(lista, inicioObra);
  if (datas.length === 0) {
    throw new Error(
      "Defina a data de início da obra do lote (ou ao menos uma data de fase) para calcular o cronograma.",
    );
  }
  for (const d of datas) {
    const { error } = await supabase
      .from("fases_obra")
      .update({ data_inicio: d.data_inicio, data_fim: d.data_fim })
      .eq("id", d.id);
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/lotes/${loteId}`);
  revalidatePath("/fases-obra");
  revalidatePath("/gantt");
  revalidatePath("/relatorios");
  return { fasesAtualizadas: datas.length };
}
