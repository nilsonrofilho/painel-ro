"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const quadraSchema = z.object({
  loteamento_id: z.string().uuid(),
  identificador: z.string().min(1, "Identificador obrigatório"),
  descricao: z.string().optional().nullable(),
  imagem_url: z.string().optional().nullable(),
});

export type QuadraInput = z.infer<typeof quadraSchema>;

export async function createQuadra(input: QuadraInput) {
  const parsed = quadraSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quadras")
    .insert(parsed)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/loteamentos/${parsed.loteamento_id}`);
  redirect(`/loteamentos/${parsed.loteamento_id}/quadras/${data.id}`);
}

export async function updateQuadra(id: string, input: Partial<QuadraInput>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quadras")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/loteamentos/${data.loteamento_id}`);
  revalidatePath(`/loteamentos/${data.loteamento_id}/quadras/${id}`);
}

export async function deleteQuadra(id: string) {
  const supabase = await createClient();
  const { data: quadra } = await supabase
    .from("quadras")
    .select("loteamento_id")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("quadras").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (quadra) {
    revalidatePath(`/loteamentos/${quadra.loteamento_id}`);
    redirect(`/loteamentos/${quadra.loteamento_id}`);
  }
}

/**
 * Duplica uma quadra (e opcionalmente todos os lotes dentro dela).
 * O identificador novo é "{original}-cópia" — se já existir, soma um sufixo numérico.
 */
export async function duplicarQuadra(
  quadraId: string,
  opts: { incluirLotes: boolean; novoIdentificador?: string } = { incluirLotes: false },
) {
  const supabase = await createClient();
  const { data: original, error: e1 } = await supabase
    .from("quadras")
    .select("*")
    .eq("id", quadraId)
    .single();
  if (e1 || !original) throw new Error(e1?.message ?? "Quadra não encontrada");

  let novoIdent =
    opts.novoIdentificador?.trim() || `${original.identificador}-cópia`;

  // Garante identificador único dentro do loteamento
  for (let attempt = 1; attempt < 50; attempt++) {
    const { data: existe } = await supabase
      .from("quadras")
      .select("id")
      .eq("loteamento_id", original.loteamento_id)
      .eq("identificador", novoIdent)
      .maybeSingle();
    if (!existe) break;
    novoIdent = `${original.identificador}-cópia-${attempt + 1}`;
  }

  const { data: nova, error: e2 } = await supabase
    .from("quadras")
    .insert({
      loteamento_id: original.loteamento_id,
      identificador: novoIdent,
      descricao: original.descricao,
      imagem_url: original.imagem_url,
    })
    .select()
    .single();
  if (e2 || !nova) throw new Error(e2?.message ?? "Falha ao duplicar quadra");

  if (opts.incluirLotes) {
    const { data: lotes } = await supabase
      .from("lotes")
      .select("*")
      .eq("quadra_id", quadraId);
    if (lotes && lotes.length > 0) {
      const novos = lotes.map((l) => {
        const { id: _id, created_at: _ca, quadra_id: _qid, ...rest } = l;
        void _id;
        void _ca;
        void _qid;
        return {
          ...rest,
          quadra_id: nova.id,
          status: "disponivel" as const,
          data_entrega_real: null,
          valor_venda: null,
        };
      });
      await supabase.from("lotes").insert(novos);
    }
  }

  revalidatePath(`/loteamentos/${original.loteamento_id}`);
  revalidatePath(`/loteamentos/${original.loteamento_id}/quadras/${nova.id}`);
  redirect(`/loteamentos/${original.loteamento_id}/quadras/${nova.id}`);
}
