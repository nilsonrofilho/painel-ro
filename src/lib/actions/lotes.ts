"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loteSchema = z.object({
  quadra_id: z.string().uuid(),
  numero: z.string().min(1, "Número obrigatório"),
  status: z
    .enum(["disponivel", "reservado", "vendido"])
    .default("disponivel"),
  etapa: z
    .enum([
      "planejamento",
      "fundacao",
      "alvenaria",
      "cobertura",
      "acabamento",
      "concluido",
    ])
    .optional()
    .nullable(),
  area_lote: z.coerce.number().optional().nullable(),
  area_construida: z.coerce.number().optional().nullable(),
  quartos: z.coerce.number().int().optional().nullable(),
  suites: z.coerce.number().int().optional().nullable(),
  banheiros: z.coerce.number().int().optional().nullable(),
  vagas: z.coerce.number().int().optional().nullable(),
  tipo_planta: z.string().optional().nullable(),
  planta_url: z.string().optional().nullable(),
  foto_url: z.string().optional().nullable(),
  data_inicio_obra: z.string().optional().nullable(),
  previsao_entrega: z.string().optional().nullable(),
  data_entrega_real: z.string().optional().nullable(),
  responsavel_id: z.string().uuid().optional().nullable(),
  valor_venda: z.coerce.number().optional().nullable(),
  orcamento_total: z.coerce.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export type LoteInput = z.infer<typeof loteSchema>;

function clean<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

type SupaClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Copia as fases de obra (incl. cronograma) e a composição de custo de um lote
 * para outro. Re-mapeia predecessora_id (auto-FK) e fase_id da composição para
 * apontarem para as novas fases — nunca para o lote de origem. gasto nasce 0
 * (mantido por trigger); o orçamento da fase é recalculado pelo trigger da
 * composição quando há itens.
 */
async function copiarFasesEComposicao(
  supabase: SupaClient,
  origemLoteId: string,
  destinoLoteId: string,
) {
  const { data: fasesOrig } = await supabase
    .from("fases_obra")
    .select(
      "id, nome, orcamento, data_inicio, data_fim, status, ordem, duracao_dias, predecessora_id",
    )
    .eq("lote_id", origemLoteId)
    .order("ordem");
  if (!fasesOrig || fasesOrig.length === 0) return;

  // 1) Insere as novas fases (sem predecessora ainda) e monta o mapa old→new.
  const { data: novasFases, error: e1 } = await supabase
    .from("fases_obra")
    .insert(
      fasesOrig.map((f) => ({
        lote_id: destinoLoteId,
        nome: f.nome,
        orcamento: f.orcamento,
        data_inicio: f.data_inicio,
        data_fim: f.data_fim,
        status: f.status,
        ordem: f.ordem,
        duracao_dias: f.duracao_dias,
        gasto: 0,
      })),
    )
    .select("id, ordem");
  if (e1) throw new Error(e1.message);

  // mapa por `ordem` (estável: cada fase tem ordem única dentro do lote)
  const novaPorOrdem = new Map<number, string>(
    (novasFases ?? []).map((f) => [f.ordem, f.id]),
  );
  const novoIdDe = (oldFaseId: string): string | undefined => {
    const orig = fasesOrig.find((f) => f.id === oldFaseId);
    return orig ? novaPorOrdem.get(orig.ordem) : undefined;
  };

  // 2) Re-mapeia predecessora_id nas novas fases.
  for (const f of fasesOrig) {
    if (!f.predecessora_id) continue;
    const novoId = novaPorOrdem.get(f.ordem);
    const novoPred = novoIdDe(f.predecessora_id);
    if (novoId && novoPred) {
      await supabase
        .from("fases_obra")
        .update({ predecessora_id: novoPred })
        .eq("id", novoId);
    }
  }

  // 3) Copia a composição de custo de cada fase para a nova fase.
  const oldFaseIds = fasesOrig.map((f) => f.id);
  const { data: itens } = await supabase
    .from("composicao_custo")
    .select(
      "fase_id, material_id, descricao, unidade, quantidade, valor_unitario, valor_total, ordem",
    )
    .in("fase_id", oldFaseIds);
  if (itens && itens.length > 0) {
    const linhas = itens
      .map((it) => {
        const novoFaseId = novoIdDe(it.fase_id);
        if (!novoFaseId) return null;
        return {
          fase_id: novoFaseId,
          material_id: it.material_id,
          descricao: it.descricao,
          unidade: it.unidade,
          quantidade: it.quantidade,
          valor_unitario: it.valor_unitario,
          valor_total: it.valor_total,
          ordem: it.ordem,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (linhas.length > 0) {
      const { error: e3 } = await supabase
        .from("composicao_custo")
        .insert(linhas);
      if (e3) throw new Error(e3.message);
    }
  }
}

export async function createLote(input: LoteInput) {
  const parsed = loteSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lotes")
    .insert(clean(parsed))
    .select()
    .single();
  if (error) throw new Error(error.message);

  const { data: quadra } = await supabase
    .from("quadras")
    .select("loteamento_id")
    .eq("id", parsed.quadra_id)
    .single();
  if (quadra) {
    revalidatePath(`/loteamentos/${quadra.loteamento_id}`);
    revalidatePath(
      `/loteamentos/${quadra.loteamento_id}/quadras/${parsed.quadra_id}`,
    );
  }
  revalidatePath("/");
  redirect(`/lotes/${data.id}`);
}

export async function updateLote(id: string, input: Partial<LoteInput>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lotes")
    .update(clean(input as Record<string, unknown>))
    .eq("id", id)
    .select("quadra_id")
    .single();
  if (error) throw new Error(error.message);
  if (data) {
    const { data: quadra } = await supabase
      .from("quadras")
      .select("loteamento_id")
      .eq("id", data.quadra_id)
      .single();
    if (quadra) {
      revalidatePath(`/loteamentos/${quadra.loteamento_id}`);
      revalidatePath(
        `/loteamentos/${quadra.loteamento_id}/quadras/${data.quadra_id}`,
      );
    }
  }
  revalidatePath(`/lotes/${id}`);
  revalidatePath("/");
  revalidatePath("/gantt");
}

export async function deleteLote(id: string) {
  const supabase = await createClient();
  const { data: lote } = await supabase
    .from("lotes")
    .select("quadra_id")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("lotes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (lote) {
    const { data: quadra } = await supabase
      .from("quadras")
      .select("loteamento_id")
      .eq("id", lote.quadra_id)
      .single();
    if (quadra) {
      revalidatePath(`/loteamentos/${quadra.loteamento_id}`);
      revalidatePath(
        `/loteamentos/${quadra.loteamento_id}/quadras/${lote.quadra_id}`,
      );
      redirect(
        `/loteamentos/${quadra.loteamento_id}/quadras/${lote.quadra_id}`,
      );
    }
  }
  redirect("/loteamentos");
}

export async function setLoteEtapa(id: string, etapa: string | null) {
  return updateLote(id, { etapa: etapa as LoteInput["etapa"] });
}

/**
 * Duplica um lote: copia todos os atributos técnicos e comerciais, mas
 * reseta status (disponível), data de entrega real e valor de venda.
 * O novo número é "{original}-cópia" — se já existir, soma sufixo.
 */
export async function duplicarLote(
  loteId: string,
  opts: { novoNumero?: string } = {},
) {
  const supabase = await createClient();
  const { data: original, error: e1 } = await supabase
    .from("lotes")
    .select("*")
    .eq("id", loteId)
    .single();
  if (e1 || !original) throw new Error(e1?.message ?? "Lote não encontrado");

  let novoNumero = opts.novoNumero?.trim() || `${original.numero}-cópia`;
  for (let attempt = 1; attempt < 50; attempt++) {
    const { data: existe } = await supabase
      .from("lotes")
      .select("id")
      .eq("quadra_id", original.quadra_id)
      .eq("numero", novoNumero)
      .maybeSingle();
    if (!existe) break;
    novoNumero = `${original.numero}-cópia-${attempt + 1}`;
  }

  const { id: _id, created_at: _ca, numero: _n, ...rest } = original;
  void _id;
  void _ca;
  void _n;
  const { data: novo, error: e2 } = await supabase
    .from("lotes")
    .insert({
      ...rest,
      numero: novoNumero,
      status: "disponivel" as const,
      data_entrega_real: null,
      valor_venda: null,
      // não herda a pasta do Drive do original (evitaria sincronizar
      // arquivos de outro lote para este).
      drive_folder_id: null,
    })
    .select()
    .single();
  if (e2 || !novo) throw new Error(e2?.message ?? "Falha ao duplicar lote");

  // Copia as fases de obra (com cronograma) e a composição de custo para o
  // novo lote — preservando as dependências (predecessora_id) re-mapeadas.
  await copiarFasesEComposicao(supabase, loteId, novo.id);

  const { data: quadra } = await supabase
    .from("quadras")
    .select("loteamento_id")
    .eq("id", original.quadra_id)
    .single();
  if (quadra) {
    revalidatePath(`/loteamentos/${quadra.loteamento_id}`);
    revalidatePath(
      `/loteamentos/${quadra.loteamento_id}/quadras/${original.quadra_id}`,
    );
  }
  revalidatePath("/");
  revalidatePath("/gantt");
  revalidatePath("/fases-obra");
  redirect(`/lotes/${novo.id}`);
}
