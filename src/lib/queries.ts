import { createClient } from "@/lib/supabase/server";
import { resolverLoteIds, type FiltroLote } from "@/lib/filters";
import type {
  Loteamento,
  Quadra,
  Lote,
  Fornecedor,
  Funcionario,
  Corretor,
  Venda,
  FaseObra,
  LancamentoMaterial,
  Alocacao,
  Documento,
} from "@/lib/supabase/types";

const ID_NENHUM = "00000000-0000-0000-0000-000000000000";

export async function getLoteamentos(): Promise<
  (Loteamento & {
    total_lotes: number;
    disponiveis: number;
    reservados: number;
    vendidos: number;
  })[]
> {
  const supabase = await createClient();
  const { data: loteamentos } = await supabase
    .from("loteamentos")
    .select("*")
    .order("created_at", { ascending: false });
  if (!loteamentos) return [];

  const enriched = await Promise.all(
    loteamentos.map(async (lot) => {
      const { data: quadras } = await supabase
        .from("quadras")
        .select("id")
        .eq("loteamento_id", lot.id);
      const quadraIds = quadras?.map((q) => q.id) ?? [];
      if (quadraIds.length === 0) {
        return {
          ...lot,
          total_lotes: 0,
          disponiveis: 0,
          reservados: 0,
          vendidos: 0,
        };
      }
      const { data: lotes } = await supabase
        .from("lotes")
        .select("status")
        .in("quadra_id", quadraIds);
      const stats = (lotes ?? []).reduce(
        (acc, l) => {
          acc.total += 1;
          if (l.status === "disponivel") acc.disponiveis += 1;
          if (l.status === "reservado") acc.reservados += 1;
          if (l.status === "vendido") acc.vendidos += 1;
          return acc;
        },
        { total: 0, disponiveis: 0, reservados: 0, vendidos: 0 },
      );
      return {
        ...lot,
        total_lotes: stats.total,
        disponiveis: stats.disponiveis,
        reservados: stats.reservados,
        vendidos: stats.vendidos,
      };
    }),
  );
  return enriched;
}

export async function getLoteamento(id: string): Promise<Loteamento | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("loteamentos")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getQuadrasDoLoteamento(
  loteamentoId: string,
): Promise<
  (Quadra & {
    total_lotes: number;
    disponiveis: number;
    reservados: number;
    vendidos: number;
  })[]
> {
  const supabase = await createClient();
  const { data: quadras } = await supabase
    .from("quadras")
    .select("*")
    .eq("loteamento_id", loteamentoId)
    .order("identificador");
  if (!quadras) return [];

  const enriched = await Promise.all(
    quadras.map(async (q) => {
      const { data: lotes } = await supabase
        .from("lotes")
        .select("status")
        .eq("quadra_id", q.id);
      const stats = (lotes ?? []).reduce(
        (acc, l) => {
          acc.total += 1;
          if (l.status === "disponivel") acc.disponiveis += 1;
          if (l.status === "reservado") acc.reservados += 1;
          if (l.status === "vendido") acc.vendidos += 1;
          return acc;
        },
        { total: 0, disponiveis: 0, reservados: 0, vendidos: 0 },
      );
      return {
        ...q,
        total_lotes: stats.total,
        disponiveis: stats.disponiveis,
        reservados: stats.reservados,
        vendidos: stats.vendidos,
      };
    }),
  );
  return enriched;
}

export async function getQuadra(id: string): Promise<Quadra | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quadras")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getLotesDaQuadra(quadraId: string): Promise<Lote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lotes")
    .select("*")
    .eq("quadra_id", quadraId)
    .order("numero");
  return data ?? [];
}

export async function getLote(id: string): Promise<Lote | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lotes")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getLoteContexto(loteId: string): Promise<{
  lote: Lote;
  quadra: Quadra;
  loteamento: Loteamento;
} | null> {
  const supabase = await createClient();
  const { data: lote } = await supabase
    .from("lotes")
    .select("*")
    .eq("id", loteId)
    .single();
  if (!lote) return null;
  const { data: quadra } = await supabase
    .from("quadras")
    .select("*")
    .eq("id", lote.quadra_id)
    .single();
  if (!quadra) return null;
  const { data: loteamento } = await supabase
    .from("loteamentos")
    .select("*")
    .eq("id", quadra.loteamento_id)
    .single();
  if (!loteamento) return null;
  return { lote, quadra, loteamento };
}

export async function getMateriaisCatalogo(): Promise<import("@/lib/supabase/types").Material[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materiais")
    .select("*")
    .order("nome");
  return (data ?? []) as import("@/lib/supabase/types").Material[];
}

export async function getMaterial(
  id: string,
): Promise<import("@/lib/supabase/types").Material | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materiais")
    .select("*")
    .eq("id", id)
    .single();
  return data as import("@/lib/supabase/types").Material | null;
}

export async function getFornecedores(): Promise<Fornecedor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fornecedores")
    .select("*")
    .order("razao_social");
  return data ?? [];
}

export async function getFuncionarios(): Promise<Funcionario[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("funcionarios")
    .select("*")
    .order("nome");
  return data ?? [];
}

export async function getCorretores(): Promise<Corretor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("corretores")
    .select("*")
    .order("nome");
  return data ?? [];
}

export async function getVendasDoLote(loteId: string): Promise<Venda[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendas")
    .select("*")
    .eq("lote_id", loteId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getFasesDoLote(loteId: string): Promise<FaseObra[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fases_obra")
    .select("*")
    .eq("lote_id", loteId)
    .order("ordem");
  return data ?? [];
}

export async function getMateriaisDoLote(
  loteId: string,
): Promise<LancamentoMaterial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lancamentos_material")
    .select("*")
    .eq("lote_id", loteId)
    .order("data", { ascending: false });
  return data ?? [];
}

export async function getAlocacoesDoLote(
  loteId: string,
): Promise<Alocacao[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("alocacoes")
    .select("*")
    .eq("lote_id", loteId)
    .order("data_inicio", { ascending: false });
  return data ?? [];
}

export async function getDocumentosDoLote(
  loteId: string,
): Promise<Documento[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documentos")
    .select("*")
    .eq("entidade_tipo", "lote")
    .eq("entidade_id", loteId)
    .order("uploaded_at", { ascending: false });
  return data ?? [];
}

export async function getDiariosDoLote(
  loteId: string,
): Promise<import("@/lib/supabase/types").DiarioObra[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diarios_obra")
    .select("*")
    .eq("lote_id", loteId)
    .order("data", { ascending: false });
  return (data ?? []) as import("@/lib/supabase/types").DiarioObra[];
}

export async function getDashboardStats(filtro?: FiltroLote) {
  const supabase = await createClient();
  const loteIds = filtro ? await resolverLoteIds(filtro) : null;

  let lotesQuery = supabase.from("lotes").select("status, valor_venda, id");
  let vendasQuery = supabase.from("vendas").select("*");
  if (loteIds !== null) {
    if (loteIds.length === 0) {
      lotesQuery = lotesQuery.eq("id", ID_NENHUM);
      vendasQuery = vendasQuery.eq("lote_id", ID_NENHUM);
    } else {
      lotesQuery = lotesQuery.in("id", loteIds);
      vendasQuery = vendasQuery.in("lote_id", loteIds);
    }
  }

  const [{ count: totalLoteamentosGeral }, { data: lotes }, { data: vendas }] =
    await Promise.all([
      supabase.from("loteamentos").select("*", { count: "exact", head: true }),
      lotesQuery,
      vendasQuery,
    ]);

  // Quando filtrado por loteamento/lote, "Loteamentos" mostra 1; senão o total
  const totalLoteamentos = filtro?.loteamentoId || filtro?.loteId
    ? 1
    : totalLoteamentosGeral ?? 0;

  const stats = (lotes ?? []).reduce(
    (acc, l) => {
      acc.total += 1;
      if (l.status === "disponivel") acc.disponiveis += 1;
      if (l.status === "reservado") acc.reservados += 1;
      if (l.status === "vendido") {
        acc.vendidos += 1;
        acc.valorVendido += Number(l.valor_venda ?? 0);
      }
      return acc;
    },
    {
      total: 0,
      disponiveis: 0,
      reservados: 0,
      vendidos: 0,
      valorVendido: 0,
    },
  );

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const vendasMes = (vendas ?? []).filter(
    (v) =>
      v.tipo === "venda" &&
      v.status !== "cancelada" &&
      v.data &&
      new Date(v.data) >= inicioMes,
  );
  const valorMes = vendasMes.reduce((s, v) => s + Number(v.valor ?? 0), 0);

  return {
    totalLoteamentos,
    ...stats,
    pctVendas: stats.total > 0 ? (stats.vendidos / stats.total) * 100 : 0,
    valorMes,
    vendasMes: vendasMes.length,
  };
}

export type VendaUltima = Venda & {
  lote: {
    numero: string;
    quadra?: { identificador: string; loteamento?: { nome: string } };
  } | null;
};

export async function getVendasUltimas(
  limit = 5,
  filtro?: FiltroLote,
): Promise<VendaUltima[]> {
  const supabase = await createClient();
  const loteIds = filtro ? await resolverLoteIds(filtro) : null;

  let query = supabase
    .from("vendas")
    .select("*, lote:lotes(numero, quadra:quadras(identificador, loteamento:loteamentos(nome)))")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (loteIds !== null) {
    if (loteIds.length === 0) return [];
    query = query.in("lote_id", loteIds);
  }
  const { data } = await query;
  return (data ?? []) as unknown as VendaUltima[];
}

export async function getGastosTotaisLote(loteId: string): Promise<number> {
  const supabase = await createClient();
  const { data: materiais } = await supabase
    .from("lancamentos_material")
    .select("tipo, valor_total")
    .eq("lote_id", loteId);
  const matTotal = (materiais ?? []).reduce(
    (s, m) => s + (m.tipo === "saida" ? Number(m.valor_total) : 0),
    0,
  );
  const { data: alocacoes } = await supabase
    .from("alocacoes")
    .select("valor_pago")
    .eq("lote_id", loteId);
  const aloTotal = (alocacoes ?? []).reduce(
    (s, a) => s + Number(a.valor_pago ?? 0),
    0,
  );
  return matTotal + aloTotal;
}

export interface EtapaAgregada {
  nome: string;
  orcamento: number;
  gasto: number;
}

/**
 * Agrega fases de obra de TODOS os lotes por nome de fase (case-insensitive),
 * somando orçamento e gasto. Usado na página de Relatórios.
 * Aceita filtro opcional por loteamento/lote.
 */
export async function getFasesTodosLotes(
  filtro?: FiltroLote,
): Promise<EtapaAgregada[]> {
  const supabase = await createClient();
  const loteIds = filtro ? await resolverLoteIds(filtro) : null;

  let query = supabase.from("fases_obra").select("nome, orcamento, gasto, lote_id");
  if (loteIds !== null) {
    if (loteIds.length === 0) return [];
    query = query.in("lote_id", loteIds);
  }
  const { data } = await query;

  const mapa = new Map<string, EtapaAgregada>();
  for (const f of data ?? []) {
    const chave = (f.nome ?? "").trim().toLowerCase();
    if (!chave) continue;
    const existente = mapa.get(chave);
    if (existente) {
      existente.orcamento += Number(f.orcamento ?? 0);
      existente.gasto += Number(f.gasto ?? 0);
    } else {
      mapa.set(chave, {
        nome: (f.nome ?? "").trim(),
        orcamento: Number(f.orcamento ?? 0),
        gasto: Number(f.gasto ?? 0),
      });
    }
  }
  return Array.from(mapa.values()).sort((a, b) => b.orcamento - a.orcamento);
}

// ============================================================
// Viabilidade
// ============================================================
import type {
  EstudoViabilidade,
  ViabilidadePrograma,
  ViabilidadeCustosItbi,
  ViabilidadeFluxo,
  ZonaUrbanistica,
  MunicipioParametros,
  CubIndice,
} from "@/lib/supabase/types";

export async function getViabilidades(): Promise<EstudoViabilidade[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estudos_viabilidade")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as EstudoViabilidade[];
}

export async function getViabilidade(
  id: string,
): Promise<EstudoViabilidade | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estudos_viabilidade")
    .select("*")
    .eq("id", id)
    .single();
  return data as EstudoViabilidade | null;
}

export async function getViabilidadeProgramas(
  estudoId: string,
): Promise<ViabilidadePrograma[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("viabilidade_programa")
    .select("*")
    .eq("estudo_id", estudoId)
    .order("ordem");
  return (data ?? []) as ViabilidadePrograma[];
}

export async function getViabilidadeCustos(
  estudoId: string,
): Promise<ViabilidadeCustosItbi[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("viabilidade_custos_itbi")
    .select("*")
    .eq("estudo_id", estudoId)
    .order("cidade");
  return (data ?? []) as ViabilidadeCustosItbi[];
}

export async function getViabilidadeFluxo(
  estudoId: string,
): Promise<ViabilidadeFluxo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("viabilidade_fluxo")
    .select("*")
    .eq("estudo_id", estudoId)
    .order("periodo");
  return (data ?? []) as ViabilidadeFluxo[];
}

export async function getZonas(
  municipio?: string,
): Promise<ZonaUrbanistica[]> {
  const supabase = await createClient();
  let query = supabase.from("zonas_urbanisticas").select("*").order("zona");
  if (municipio) query = query.eq("municipio", municipio);
  const { data } = await query;
  return (data ?? []) as ZonaUrbanistica[];
}

export async function getZona(id: string): Promise<ZonaUrbanistica | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("zonas_urbanisticas")
    .select("*")
    .eq("id", id)
    .single();
  return data as ZonaUrbanistica | null;
}

export async function getMunicipiosParametros(): Promise<
  MunicipioParametros[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("municipios_parametros")
    .select("*")
    .order("municipio");
  return (data ?? []) as MunicipioParametros[];
}

export async function getCubIndices(): Promise<CubIndice[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cub_indices")
    .select("*")
    .order("mes_referencia", { ascending: false });
  return (data ?? []) as CubIndice[];
}

/** CUB mais recente para a combinação estado+padrão+tipo. */
export async function getCubVigente(
  estado: string,
  padrao: string,
  tipoProjeto: string,
): Promise<CubIndice | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cub_indices")
    .select("*")
    .eq("estado", estado)
    .eq("padrao", padrao)
    .eq("tipo_projeto", tipoProjeto)
    .order("mes_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as CubIndice | null;
}

export async function getLotesParaGantt() {
  const supabase = await createClient();
  const { data: lotes } = await supabase
    .from("lotes")
    .select(
      "id, numero, status, etapa, previsao_entrega, data_entrega_real, quadra:quadras(identificador, loteamento:loteamentos(id, nome, data_inicio))",
    )
    .order("created_at", { ascending: false });
  return lotes ?? [];
}
