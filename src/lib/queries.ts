import { createClient } from "@/lib/supabase/server";
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

export async function getDashboardStats() {
  const supabase = await createClient();
  const [{ count: totalLoteamentos }, { data: lotes }, { data: vendas }] =
    await Promise.all([
      supabase.from("loteamentos").select("*", { count: "exact", head: true }),
      supabase.from("lotes").select("status, valor_venda"),
      supabase.from("vendas").select("*"),
    ]);

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
    totalLoteamentos: totalLoteamentos ?? 0,
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

export async function getVendasUltimas(limit = 5): Promise<VendaUltima[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendas")
    .select("*, lote:lotes(numero, quadra:quadras(identificador, loteamento:loteamentos(nome)))")
    .order("created_at", { ascending: false })
    .limit(limit);
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
