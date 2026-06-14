import { createClient } from "@/lib/supabase/server";

export interface FiltroLote {
  loteamentoId?: string;
  loteId?: string;
}

/**
 * Normaliza os searchParams crus em um filtro tipado.
 * Strings vazias viram undefined. Se há loteId, ele tem precedência.
 */
export function parseFiltro(params?: {
  loteamento?: string;
  lote?: string;
}): FiltroLote {
  const loteamentoId = params?.loteamento?.trim() || undefined;
  const loteId = params?.lote?.trim() || undefined;
  return { loteamentoId, loteId };
}

/**
 * Resolve o loteamento_id ao qual um lote pertence (via quadra).
 * Retorna null se o lote não existe.
 */
export async function loteamentoIdDoLote(
  loteId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lotes")
    .select("quadra:quadras(loteamento_id)")
    .eq("id", loteId)
    .single();
  const quadra = data?.quadra as unknown as { loteamento_id: string } | null;
  return quadra?.loteamento_id ?? null;
}

/**
 * Resolve a lista de IDs de lote que correspondem ao filtro.
 * - Sem filtro: retorna null (= "todos", sem restrição).
 * - loteId definido: retorna [loteId], desde que pertença ao loteamento
 *   filtrado (se houver). Se for de outro loteamento, retorna [] (vazio).
 * - só loteamentoId: retorna todos os lotes daquele loteamento.
 *
 * Retornar null evita queries desnecessárias quando não há filtro.
 */
export async function resolverLoteIds(
  filtro: FiltroLote,
): Promise<string[] | null> {
  if (filtro.loteId) {
    // Coerência: lote precisa pertencer ao loteamento filtrado (se houver)
    if (filtro.loteamentoId) {
      const lotamentoReal = await loteamentoIdDoLote(filtro.loteId);
      if (lotamentoReal !== filtro.loteamentoId) return [];
    }
    return [filtro.loteId];
  }
  if (!filtro.loteamentoId) return null;

  const supabase = await createClient();
  const { data: quadras } = await supabase
    .from("quadras")
    .select("id")
    .eq("loteamento_id", filtro.loteamentoId);
  const quadraIds = (quadras ?? []).map((q) => q.id);
  if (quadraIds.length === 0) return [];

  const { data: lotes } = await supabase
    .from("lotes")
    .select("id")
    .in("quadra_id", quadraIds);
  return (lotes ?? []).map((l) => l.id);
}

export interface OpcaoLoteamento {
  id: string;
  nome: string;
}

export interface OpcaoLote {
  id: string;
  numero: string;
  loteamentoId: string;
  quadraIdentificador: string;
}

/**
 * Carrega as opções para os seletores de filtro:
 * todos os loteamentos + todos os lotes (com o loteamento ao qual pertencem).
 */
export async function getOpcoesFiltro(): Promise<{
  loteamentos: OpcaoLoteamento[];
  lotes: OpcaoLote[];
}> {
  const supabase = await createClient();
  const [{ data: loteamentos }, { data: lotes }] = await Promise.all([
    supabase.from("loteamentos").select("id, nome").order("nome"),
    supabase
      .from("lotes")
      .select(
        "id, numero, quadra:quadras(identificador, loteamento_id)",
      )
      .order("numero"),
  ]);

  const lotesNorm: OpcaoLote[] = (lotes ?? [])
    .map((l) => {
      const quadra = l.quadra as unknown as {
        identificador: string;
        loteamento_id: string;
      } | null;
      if (!quadra) return null;
      return {
        id: l.id,
        numero: l.numero,
        loteamentoId: quadra.loteamento_id,
        quadraIdentificador: quadra.identificador,
      };
    })
    .filter((x): x is OpcaoLote => x !== null);

  return {
    loteamentos: (loteamentos ?? []) as OpcaoLoteamento[],
    lotes: lotesNorm,
  };
}
