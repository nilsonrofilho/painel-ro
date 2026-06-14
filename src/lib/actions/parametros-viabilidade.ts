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
  revalidatePath("/parametros");
  revalidatePath("/viabilidade");
}

// ============================================================
// Municípios (ITBI, áreas públicas)
// ============================================================
const municipioSchema = z.object({
  municipio: z.string().min(1, "Município obrigatório"),
  estado: z.string().min(2, "Estado obrigatório"),
  itbi_aliquota_pct: z.coerce.number().default(2),
  itbi_base: z
    .enum(["valor_transacao", "valor_venal", "maior_entre"])
    .default("maior_entre"),
  cub_estado: z.string().optional().nullable(),
  areas_publicas_min_pct: z.coerce.number().optional().nullable(),
  observacao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
});

export async function saveMunicipio(
  input: z.infer<typeof municipioSchema>,
  id?: string,
) {
  const parsed = municipioSchema.parse(input);
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("municipios_parametros")
      .update({ ...clean(parsed as Record<string, unknown>), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("municipios_parametros")
      .insert(clean(parsed as Record<string, unknown>));
    if (error) {
      if (error.code === "23505")
        throw new Error("Esse município/estado já está cadastrado.");
      throw new Error(error.message);
    }
  }
  revalidar();
}

export async function deleteMunicipio(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("municipios_parametros")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}

// ============================================================
// CUB
// ============================================================
const cubSchema = z.object({
  estado: z.string().min(2),
  padrao: z.enum(["baixo", "normal", "alto"]),
  tipo_projeto: z.string().min(1),
  valor_m2: z.coerce.number().min(0),
  mes_referencia: z.string().min(1),
  fonte: z.string().optional().nullable(),
});

export async function saveCub(input: z.infer<typeof cubSchema>, id?: string) {
  const parsed = cubSchema.parse(input);
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("cub_indices")
      .update(clean(parsed as Record<string, unknown>))
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("cub_indices")
      .insert(clean(parsed as Record<string, unknown>));
    if (error) {
      if (error.code === "23505")
        throw new Error("Já existe CUB para essa combinação e mês.");
      throw new Error(error.message);
    }
  }
  revalidar();
}

export async function deleteCub(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cub_indices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}

// ============================================================
// Zonas urbanísticas
// ============================================================
const zonaSchema = z.object({
  municipio: z.string().min(1),
  estado: z.string().min(2),
  zona: z.string().min(1),
  descricao: z.string().optional().nullable(),
  densidade: z.string().optional().nullable(),
  to_pct: z.coerce.number().default(50),
  ca_basico: z.coerce.number().default(1),
  ca_maximo: z.coerce.number().optional().nullable(),
  ca_minimo: z.coerce.number().optional().nullable(),
  recuo_frontal_m: z.coerce.number().optional().nullable(),
  recuo_lateral_m: z.coerce.number().optional().nullable(),
  recuo_fundos_m: z.coerce.number().optional().nullable(),
  gabarito_max_m: z.coerce.number().optional().nullable(),
  gabarito_max_pavimentos: z.coerce.number().int().optional().nullable(),
  taxa_permeabilidade_pct: z.coerce.number().optional().nullable(),
  permite_outorga: z.boolean().default(false),
  valor_m2_terreno_pgv: z.coerce.number().optional().nullable(),
});

export async function saveZona(input: z.infer<typeof zonaSchema>, id?: string) {
  const parsed = zonaSchema.parse(input);
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("zonas_urbanisticas")
      .update(clean(parsed as Record<string, unknown>))
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("zonas_urbanisticas")
      .insert(clean(parsed as Record<string, unknown>));
    if (error) {
      if (error.code === "23505")
        throw new Error("Essa zona já existe para o município.");
      throw new Error(error.message);
    }
  }
  revalidar();
}

export async function deleteZona(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("zonas_urbanisticas")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}
