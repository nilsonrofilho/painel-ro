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

function revalidarEstudo(id: string) {
  revalidatePath("/viabilidade");
  revalidatePath(`/viabilidade/${id}`);
}

// ============================================================
// Estudo (cabeçalho)
// ============================================================
const estudoSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  loteamento_id: z.string().uuid().optional().nullable(),
  municipio: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  municipio_id: z.string().uuid().optional().nullable(),
  zona_id: z.string().uuid().optional().nullable(),
  endereco: z.string().optional().nullable(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  tipo_empreendimento: z
    .enum(["loteamento", "casas", "vertical", "misto"])
    .default("loteamento"),
  area_terreno_m2: z.coerce.number().optional().nullable(),
  custo_terreno: z.coerce.number().optional().nullable(),
  valor_venal_referencia: z.coerce.number().optional().nullable(),
  itbi_aliquota_pct: z.coerce.number().optional().nullable(),
  outorga_valor: z.coerce.number().optional().nullable(),
  custos_cartorio: z.coerce.number().optional().nullable(),
  ca_pretendido: z.coerce.number().optional().nullable(),
  fator_eficiencia: z.coerce.number().optional().nullable(),
  pe_direito_m: z.coerce.number().optional().nullable(),
  custo_infraestrutura: z.coerce.number().optional().nullable(),
  padrao_construcao: z.enum(["baixo", "normal", "alto"]).optional().nullable(),
  tipo_projeto_cub: z.string().optional().nullable(),
  cub_valor_m2: z.coerce.number().optional().nullable(),
  bdi_pct: z.coerce.number().optional().nullable(),
  comissao_venda_pct: z.coerce.number().optional().nullable(),
  regime_tributario: z
    .enum(["RET", "RET_social", "presumido", "real"])
    .optional()
    .nullable(),
  imposto_venda_pct: z.coerce.number().optional().nullable(),
  custos_indiretos_pct: z.coerce.number().optional().nullable(),
  distratos_pct: z.coerce.number().optional().nullable(),
  custo_financeiro: z.coerce.number().optional().nullable(),
  tma_pct: z.coerce.number().optional().nullable(),
  status: z.enum(["rascunho", "aprovado", "reprovado"]).optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export type EstudoInput = z.infer<typeof estudoSchema>;

export async function createViabilidade(input: EstudoInput) {
  const parsed = estudoSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estudos_viabilidade")
    .insert(clean(parsed as Record<string, unknown>))
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/viabilidade");
  redirect(`/viabilidade/${data.id}`);
}

export async function updateViabilidade(
  id: string,
  input: Partial<EstudoInput>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("estudos_viabilidade")
    .update({ ...clean(input as Record<string, unknown>), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidarEstudo(id);
}

export async function deleteViabilidade(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("estudos_viabilidade")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/viabilidade");
  redirect("/viabilidade");
}

export async function duplicarViabilidade(id: string) {
  const supabase = await createClient();
  const { data: original, error } = await supabase
    .from("estudos_viabilidade")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !original) throw new Error(error?.message ?? "Estudo não encontrado");

  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = original;
  void _id;
  void _ca;
  void _ua;
  const { data: novo, error: e2 } = await supabase
    .from("estudos_viabilidade")
    .insert({ ...rest, nome: `${original.nome} (cópia)`, status: "rascunho" })
    .select()
    .single();
  if (e2 || !novo) throw new Error(e2?.message ?? "Falha ao duplicar");

  // Copia programa
  const { data: prog } = await supabase
    .from("viabilidade_programa")
    .select("*")
    .eq("estudo_id", id);
  if (prog && prog.length) {
    await supabase.from("viabilidade_programa").insert(
      prog.map((p) => {
        const { id: _pid, created_at: _pca, estudo_id: _pe, ...pr } = p;
        void _pid;
        void _pca;
        void _pe;
        return { ...pr, estudo_id: novo.id };
      }),
    );
  }

  // Copia ITBI por cidade
  const { data: itbis } = await supabase
    .from("viabilidade_custos_itbi")
    .select("*")
    .eq("estudo_id", id);
  if (itbis && itbis.length) {
    await supabase.from("viabilidade_custos_itbi").insert(
      itbis.map((it) => {
        const { id: _iid, estudo_id: _ie, ...ir } = it;
        void _iid;
        void _ie;
        return { ...ir, estudo_id: novo.id };
      }),
    );
  }

  // Copia fluxo de caixa
  const { data: fluxos } = await supabase
    .from("viabilidade_fluxo")
    .select("*")
    .eq("estudo_id", id);
  if (fluxos && fluxos.length) {
    await supabase.from("viabilidade_fluxo").insert(
      fluxos.map((f) => {
        const { id: _fid, created_at: _fca, estudo_id: _fe, ...fr } = f;
        void _fid;
        void _fca;
        void _fe;
        return { ...fr, estudo_id: novo.id };
      }),
    );
  }

  revalidatePath("/viabilidade");
  redirect(`/viabilidade/${novo.id}`);
}

// ============================================================
// Programa (unidades)
// ============================================================
const programaSchema = z.object({
  estudo_id: z.string().uuid(),
  tipo_unidade: z.string().min(1),
  descricao: z.string().optional().nullable(),
  quantidade: z.coerce.number().int().min(1).default(1),
  area_privativa_m2: z.coerce.number().optional().nullable(),
  area_construida_m2: z.coerce.number().optional().nullable(),
  preco_m2_venda: z.coerce.number().optional().nullable(),
  valor_venda_unitario: z.coerce.number().optional().nullable(),
  ordem: z.coerce.number().int().default(0),
});

export async function addPrograma(input: z.infer<typeof programaSchema>) {
  const parsed = programaSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("viabilidade_programa")
    .insert(clean(parsed as Record<string, unknown>));
  if (error) throw new Error(error.message);
  revalidarEstudo(parsed.estudo_id);
}

export async function updatePrograma(
  id: string,
  estudoId: string,
  input: Partial<z.infer<typeof programaSchema>>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("viabilidade_programa")
    .update(clean(input as Record<string, unknown>))
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidarEstudo(estudoId);
}

export async function deletePrograma(id: string, estudoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("viabilidade_programa")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidarEstudo(estudoId);
}

// ============================================================
// Custos / ITBI por cidade
// ============================================================
const itbiSchema = z.object({
  estudo_id: z.string().uuid(),
  municipio_id: z.string().uuid().optional().nullable(),
  cidade: z.string().min(1),
  estado: z.string().optional().nullable(),
  aliquota_pct: z.coerce.number(),
  base_calculo: z.coerce.number().default(0),
  valor_estimado: z.coerce.number().default(0),
  selecionado: z.boolean().default(false),
});

export async function addCustoItbi(input: z.infer<typeof itbiSchema>) {
  const parsed = itbiSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("viabilidade_custos_itbi")
    .insert(clean(parsed as Record<string, unknown>));
  if (error) {
    if (error.code === "23505")
      throw new Error("Essa cidade já está na tabela do estudo.");
    throw new Error(error.message);
  }
  revalidarEstudo(parsed.estudo_id);
}

export async function updateCustoItbi(
  id: string,
  estudoId: string,
  input: Partial<z.infer<typeof itbiSchema>>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("viabilidade_custos_itbi")
    .update(clean(input as Record<string, unknown>))
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidarEstudo(estudoId);
}

export async function deleteCustoItbi(id: string, estudoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("viabilidade_custos_itbi")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidarEstudo(estudoId);
}

/** Marca uma cidade como a selecionada (desmarca as demais do estudo). */
export async function selecionarCidadeItbi(id: string, estudoId: string) {
  const supabase = await createClient();
  const { error: e1 } = await supabase
    .from("viabilidade_custos_itbi")
    .update({ selecionado: false })
    .eq("estudo_id", estudoId);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await supabase
    .from("viabilidade_custos_itbi")
    .update({ selecionado: true })
    .eq("id", id);
  if (e2) throw new Error(e2.message);
  revalidarEstudo(estudoId);
}

// ============================================================
// Fluxo de caixa
// ============================================================
const fluxoSchema = z.object({
  estudo_id: z.string().uuid(),
  periodo: z.coerce.number().int().min(0),
  rotulo: z.string().optional().nullable(),
  entradas: z.coerce.number().default(0),
  saidas: z.coerce.number().default(0),
});

export async function upsertFluxo(input: z.infer<typeof fluxoSchema>) {
  const parsed = fluxoSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("viabilidade_fluxo")
    .upsert(clean(parsed as Record<string, unknown>), {
      onConflict: "estudo_id,periodo",
    });
  if (error) throw new Error(error.message);
  revalidarEstudo(parsed.estudo_id);
}

export async function deleteFluxoPeriodo(id: string, estudoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("viabilidade_fluxo")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidarEstudo(estudoId);
}
