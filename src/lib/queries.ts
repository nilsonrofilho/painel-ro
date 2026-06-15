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
  Material,
  ComposicaoCusto,
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

export async function getMateriaisCatalogo(): Promise<Material[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materiais")
    .select("*")
    .order("nome");
  return (data ?? []) as Material[];
}

export async function getMaterial(
  id: string,
): Promise<Material | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materiais")
    .select("*")
    .eq("id", id)
    .single();
  return data as Material | null;
}

export interface MaterialComEstoque extends Material {
  saldo_estoque: number;
  abaixo_minimo: boolean;
}

/**
 * Catálogo de materiais com saldo de estoque derivado dos lançamentos
 * (entradas somam, saídas subtraem) que têm material_id.
 */
export async function getMateriaisComEstoque(): Promise<MaterialComEstoque[]> {
  const supabase = await createClient();
  const [{ data: materiais }, { data: lancs }] = await Promise.all([
    supabase.from("materiais").select("*").order("nome"),
    supabase
      .from("lancamentos_material")
      .select("material_id, tipo, quantidade")
      .not("material_id", "is", null),
  ]);

  const saldoPorMaterial = new Map<string, number>();
  for (const l of lancs ?? []) {
    if (!l.material_id) continue;
    const delta =
      l.tipo === "entrada"
        ? Number(l.quantidade ?? 0)
        : -Number(l.quantidade ?? 0);
    saldoPorMaterial.set(
      l.material_id,
      (saldoPorMaterial.get(l.material_id) ?? 0) + delta,
    );
  }

  return (materiais ?? []).map((m) => {
    const material = m as Material;
    const saldo = saldoPorMaterial.get(material.id) ?? 0;
    const minimo = Number(material.estoque_minimo ?? 0);
    return {
      ...material,
      saldo_estoque: saldo,
      abaixo_minimo: minimo > 0 && saldo < minimo,
    };
  });
}

// ============================================================
// Curva ABC de materiais (por gasto)
// ============================================================
export interface ItemCurvaABC {
  material: string;
  valor: number;
  qtd_lancamentos: number;
  pct: number;
  pct_acumulado: number;
  classe: "A" | "B" | "C";
}

export async function getCurvaABCMateriais(
  filtro?: FiltroLote,
): Promise<ItemCurvaABC[]> {
  const supabase = await createClient();
  const loteIds = filtro ? await resolverLoteIds(filtro) : null;

  let query = supabase
    .from("lancamentos_material")
    .select("material, valor_total, tipo, lote_id")
    .eq("tipo", "saida");
  if (loteIds !== null) {
    if (loteIds.length === 0) return [];
    query = query.in("lote_id", loteIds);
  }
  const { data } = await query;

  // Agrega gasto por nome de material
  const mapa = new Map<string, { valor: number; qtd: number }>();
  for (const l of data ?? []) {
    const nome = (l.material ?? "").trim() || "Sem nome";
    const ex = mapa.get(nome) ?? { valor: 0, qtd: 0 };
    ex.valor += Number(l.valor_total ?? 0);
    ex.qtd += 1;
    mapa.set(nome, ex);
  }

  const itens = Array.from(mapa.entries())
    .map(([material, v]) => ({ material, valor: v.valor, qtd: v.qtd }))
    .filter((i) => i.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const total = itens.reduce((s, i) => s + i.valor, 0);
  let acumulado = 0;
  return itens.map((i) => {
    const pct = total > 0 ? (i.valor / total) * 100 : 0;
    acumulado += pct;
    const classe: "A" | "B" | "C" =
      acumulado <= 80 ? "A" : acumulado <= 95 ? "B" : "C";
    return {
      material: i.material,
      valor: i.valor,
      qtd_lancamentos: i.qtd,
      pct,
      pct_acumulado: acumulado,
      classe,
    };
  });
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

/** Itens de composição de custo de todas as fases de um lote, agrupados por fase_id. */
export async function getComposicoesDoLote(
  loteId: string,
): Promise<Record<string, ComposicaoCusto[]>> {
  const supabase = await createClient();
  const { data: fases } = await supabase
    .from("fases_obra")
    .select("id")
    .eq("lote_id", loteId);
  const faseIds = (fases ?? []).map((f) => f.id);
  if (faseIds.length === 0) return {};

  const { data } = await supabase
    .from("composicao_custo")
    .select("*")
    .in("fase_id", faseIds)
    .order("ordem");

  const mapa: Record<
    string,
    ComposicaoCusto[]
  > = {};
  for (const item of data ?? []) {
    const it = item as ComposicaoCusto;
    (mapa[it.fase_id] ??= []).push(it);
  }
  return mapa;
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

export async function getDashboardStats(
  filtro?: FiltroLote,
  periodo?: { inicio: string | null; fim: string | null },
) {
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

  // Janela do período: usa o período informado ou cai no mês atual
  const now = new Date();
  const inicio = periodo?.inicio
    ? new Date(periodo.inicio + "T00:00:00")
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const fim = periodo?.fim ? new Date(periodo.fim + "T23:59:59") : null;

  const vendasPeriodo = (vendas ?? []).filter((v) => {
    if (v.tipo !== "venda" || v.status === "cancelada" || !v.data) return false;
    const d = new Date(v.data);
    if (d < inicio) return false;
    if (fim && d > fim) return false;
    return true;
  });
  const valorMes = vendasPeriodo.reduce((s, v) => s + Number(v.valor ?? 0), 0);

  return {
    totalLoteamentos,
    ...stats,
    pctVendas: stats.total > 0 ? (stats.vendidos / stats.total) * 100 : 0,
    valorMes,
    vendasMes: vendasPeriodo.length,
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
// Investidores
// ============================================================
import type { Investidor } from "@/lib/supabase/types";

export interface AporteComLote {
  id: string;
  valor_investido: number;
  retorno_pct: number | null;
  retorno_valor: number | null;
  data_aporte: string | null;
  observacao: string | null;
  lote_id: string;
  lote_numero: string;
  quadra_identificador: string;
  loteamento_id: string;
  loteamento_nome: string;
  lote_status: string;
  lote_etapa: string | null;
}

export interface InvestidorResumo extends Investidor {
  total_investido: number;
  retorno_projetado: number;
  qtd_lotes: number;
}

function retornoDoAporte(a: {
  valor_investido: number;
  retorno_pct: number | null;
  retorno_valor: number | null;
}): number {
  if (a.retorno_valor != null) return Number(a.retorno_valor);
  if (a.retorno_pct != null)
    return (Number(a.valor_investido) * Number(a.retorno_pct)) / 100;
  return 0;
}

export async function getInvestidores(): Promise<InvestidorResumo[]> {
  const supabase = await createClient();
  const { data: investidores } = await supabase
    .from("investidores")
    .select("*")
    .order("nome");
  if (!investidores) return [];

  const { data: aportes } = await supabase
    .from("aportes")
    .select("investidor_id, valor_investido, retorno_pct, retorno_valor");

  return investidores.map((inv) => {
    const meus = (aportes ?? []).filter((a) => a.investidor_id === inv.id);
    return {
      ...(inv as Investidor),
      total_investido: meus.reduce(
        (s, a) => s + Number(a.valor_investido ?? 0),
        0,
      ),
      retorno_projetado: meus.reduce((s, a) => s + retornoDoAporte(a), 0),
      qtd_lotes: meus.length,
    };
  });
}

export async function getInvestidor(id: string): Promise<Investidor | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("investidores")
    .select("*")
    .eq("id", id)
    .single();
  return data as Investidor | null;
}

export interface AporteDoLote {
  id: string;
  investidor_id: string;
  investidor_nome: string;
  valor_investido: number;
  retorno_pct: number | null;
  retorno_valor: number | null;
}

/** Aportes (investidores) vinculados a um lote específico. */
export async function getAportesDoLote(
  loteId: string,
): Promise<AporteDoLote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("aportes")
    .select(
      "id, investidor_id, valor_investido, retorno_pct, retorno_valor, investidor:investidores(nome)",
    )
    .eq("lote_id", loteId);
  return (data ?? []).map((a) => {
    const inv = a.investidor as unknown as { nome: string } | null;
    return {
      id: a.id,
      investidor_id: a.investidor_id,
      investidor_nome: inv?.nome ?? "—",
      valor_investido: Number(a.valor_investido ?? 0),
      retorno_pct: a.retorno_pct,
      retorno_valor: a.retorno_valor,
    };
  });
}

export async function getInvestidorPorToken(
  token: string,
): Promise<Investidor | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("investidores")
    .select("*")
    .eq("token_publico", token)
    .maybeSingle();
  return data as Investidor | null;
}

export async function getAportesDoInvestidor(
  investidorId: string,
): Promise<AporteComLote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("aportes")
    .select(
      "*, lote:lotes(numero, status, etapa, quadra:quadras(identificador, loteamento:loteamentos(id, nome)))",
    )
    .eq("investidor_id", investidorId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((a) => {
      const lote = a.lote as unknown as {
        numero: string;
        status: string;
        etapa: string | null;
        quadra?: {
          identificador: string;
          loteamento?: { id: string; nome: string };
        };
      } | null;
      if (!lote?.quadra?.loteamento) return null;
      return {
        id: a.id,
        valor_investido: Number(a.valor_investido ?? 0),
        retorno_pct: a.retorno_pct,
        retorno_valor: a.retorno_valor,
        data_aporte: a.data_aporte,
        observacao: a.observacao,
        lote_id: a.lote_id,
        lote_numero: lote.numero,
        quadra_identificador: lote.quadra.identificador,
        loteamento_id: lote.quadra.loteamento.id,
        loteamento_nome: lote.quadra.loteamento.nome,
        lote_status: lote.status,
        lote_etapa: lote.etapa,
      } as AporteComLote;
    })
    .filter((x): x is AporteComLote => x !== null);
}

export interface DashboardInvestidor {
  totalCaptado: number;
  retornoProjetado: number;
  qtdInvestidores: number;
  qtdAportes: number;
  porLoteamento: { nome: string; valor: number }[];
  porInvestidor: { nome: string; valor: number; retorno: number }[];
}

export async function getDashboardInvestidor(): Promise<DashboardInvestidor> {
  const investidores = await getInvestidores();
  const supabase = await createClient();
  const { data: aportes } = await supabase
    .from("aportes")
    .select(
      "valor_investido, retorno_pct, retorno_valor, lote:lotes(quadra:quadras(loteamento:loteamentos(nome)))",
    );

  const porLot = new Map<string, number>();
  let qtdAportes = 0;
  for (const a of aportes ?? []) {
    qtdAportes += 1;
    const lote = a.lote as unknown as {
      quadra?: { loteamento?: { nome: string } };
    } | null;
    const nome = lote?.quadra?.loteamento?.nome ?? "Sem loteamento";
    porLot.set(nome, (porLot.get(nome) ?? 0) + Number(a.valor_investido ?? 0));
  }

  return {
    totalCaptado: investidores.reduce((s, i) => s + i.total_investido, 0),
    retornoProjetado: investidores.reduce(
      (s, i) => s + i.retorno_projetado,
      0,
    ),
    qtdInvestidores: investidores.length,
    qtdAportes,
    porLoteamento: Array.from(porLot.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor),
    porInvestidor: investidores
      .map((i) => ({
        nome: i.nome,
        valor: i.total_investido,
        retorno: i.retorno_projetado,
      }))
      .sort((a, b) => b.valor - a.valor),
  };
}

// ============================================================
// Financeiro
// ============================================================
import type { LancamentoFinanceiro } from "@/lib/supabase/types";
import type { LinhaDRE } from "@/lib/financeiro";

export async function getLancamentosFinanceiros(
  filtro?: FiltroLote,
): Promise<LancamentoFinanceiro[]> {
  const supabase = await createClient();
  const loteIds = filtro ? await resolverLoteIds(filtro) : null;
  let query = supabase
    .from("lancamentos_financeiros")
    .select("*")
    .order("data_vencimento", { ascending: true });
  if (filtro?.loteamentoId) query = query.eq("loteamento_id", filtro.loteamentoId);
  if (loteIds !== null && filtro?.loteId) {
    query = query.eq("lote_id", filtro.loteId);
  }
  const { data } = await query;
  return (data ?? []) as LancamentoFinanceiro[];
}

export interface ResumoFinanceiro {
  totalReceber: number;
  totalPagar: number;
  recebidoMes: number;
  pagoMes: number;
  atrasadoReceber: number;
  atrasadoPagar: number;
  saldoPrevisto: number;
}

export async function getResumoFinanceiro(
  filtro?: FiltroLote,
): Promise<ResumoFinanceiro> {
  const lancamentos = await getLancamentosFinanceiros(filtro);
  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  const inicioMesStr = inicioMes.toISOString().slice(0, 10);

  const r: ResumoFinanceiro = {
    totalReceber: 0,
    totalPagar: 0,
    recebidoMes: 0,
    pagoMes: 0,
    atrasadoReceber: 0,
    atrasadoPagar: 0,
    saldoPrevisto: 0,
  };

  for (const l of lancamentos) {
    if (l.status === "cancelado") continue;
    const valor = Number(l.valor ?? 0);
    const pago = Number(l.valor_pago ?? l.valor ?? 0);
    if (l.status === "pendente") {
      if (l.tipo === "receber") r.totalReceber += valor;
      else r.totalPagar += valor;
      if (l.data_vencimento < hoje) {
        if (l.tipo === "receber") r.atrasadoReceber += valor;
        else r.atrasadoPagar += valor;
      }
    } else if (l.status === "pago" && l.data_pagamento) {
      if (l.data_pagamento >= inicioMesStr) {
        if (l.tipo === "receber") r.recebidoMes += pago;
        else r.pagoMes += pago;
      }
    }
  }
  r.saldoPrevisto = r.totalReceber - r.totalPagar;
  return r;
}

/**
 * Monta as linhas da DRE a partir de várias fontes (regime de caixa):
 * - Receitas: vendas ativas + lançamentos 'receber' pagos
 * - Custos diretos: materiais (saída) + alocações + lançamentos obra/terreno
 * - Despesas: comissões de venda + lançamentos admin/marketing/imposto/etc.
 */
export async function getDRELinhas(filtro?: FiltroLote): Promise<LinhaDRE[]> {
  const supabase = await createClient();
  const loteIds = filtro ? await resolverLoteIds(filtro) : null;
  const linhas: LinhaDRE[] = [];

  // Vendas (receita) — usa valor da venda ativa
  let vendasQ = supabase
    .from("vendas")
    .select("valor, comissao_valor, status, tipo, lote_id")
    .eq("tipo", "venda")
    .eq("status", "ativa");
  if (loteIds !== null) {
    if (loteIds.length === 0) vendasQ = vendasQ.eq("lote_id", ID_NENHUM);
    else vendasQ = vendasQ.in("lote_id", loteIds);
  }
  const { data: vendas } = await vendasQ;
  for (const v of vendas ?? []) {
    if (v.valor) {
      linhas.push({
        natureza: "receita",
        categoria: "venda",
        loteamento_id: null,
        lote_id: v.lote_id,
        valor: Number(v.valor),
      });
    }
    if (v.comissao_valor) {
      linhas.push({
        natureza: "despesa_operacional",
        categoria: "comissao",
        loteamento_id: null,
        lote_id: v.lote_id,
        valor: Number(v.comissao_valor),
      });
    }
  }

  // Materiais (custo direto, saída)
  let matQ = supabase
    .from("lancamentos_material")
    .select("valor_total, tipo, lote_id")
    .eq("tipo", "saida");
  if (loteIds !== null) {
    if (loteIds.length === 0) matQ = matQ.eq("lote_id", ID_NENHUM);
    else matQ = matQ.in("lote_id", loteIds);
  }
  const { data: mats } = await matQ;
  for (const m of mats ?? []) {
    linhas.push({
      natureza: "custo_direto",
      categoria: "obra",
      loteamento_id: null,
      lote_id: m.lote_id,
      valor: Number(m.valor_total ?? 0),
    });
  }

  // Alocações (mão de obra)
  let alocQ = supabase.from("alocacoes").select("valor_pago, lote_id");
  if (loteIds !== null) {
    if (loteIds.length === 0) alocQ = alocQ.eq("lote_id", ID_NENHUM);
    else alocQ = alocQ.in("lote_id", loteIds);
  }
  const { data: alocs } = await alocQ;
  for (const a of alocs ?? []) {
    if (a.valor_pago) {
      linhas.push({
        natureza: "custo_direto",
        categoria: "obra",
        loteamento_id: null,
        lote_id: a.lote_id,
        valor: Number(a.valor_pago),
      });
    }
  }

  // Lançamentos financeiros avulsos
  const lancs = await getLancamentosFinanceiros(filtro);
  for (const l of lancs) {
    if (l.status === "cancelado") continue;
    const valor = Number(l.valor_pago ?? l.valor ?? 0);
    if (l.tipo === "receber") {
      linhas.push({
        natureza: "receita",
        categoria: l.categoria,
        loteamento_id: l.loteamento_id,
        lote_id: l.lote_id,
        valor,
      });
    } else {
      const direto = l.categoria === "obra" || l.categoria === "terreno";
      linhas.push({
        natureza: direto ? "custo_direto" : "despesa_operacional",
        categoria: l.categoria,
        loteamento_id: l.loteamento_id,
        lote_id: l.lote_id,
        valor,
      });
    }
  }

  return linhas;
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
