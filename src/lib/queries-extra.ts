import { createClient } from "@/lib/supabase/server";
import { resolverLoteIds, type FiltroLote } from "@/lib/filters";

export async function getVendasPorMes(meses = 12, filtro?: FiltroLote) {
  const supabase = await createClient();
  const desde = new Date();
  desde.setMonth(desde.getMonth() - (meses - 1));
  desde.setDate(1);

  const loteIds = filtro ? await resolverLoteIds(filtro) : null;

  let query = supabase
    .from("vendas")
    .select("data, valor, tipo, status, lote_id")
    .gte("data", desde.toISOString().slice(0, 10))
    .neq("status", "cancelada")
    .eq("tipo", "venda");
  if (loteIds !== null) {
    if (loteIds.length === 0) {
      // filtro vazio: nenhum lote → buckets zerados
      query = query.eq("lote_id", "00000000-0000-0000-0000-000000000000");
    } else {
      query = query.in("lote_id", loteIds);
    }
  }
  const { data } = await query;

  const buckets: Record<string, { mes: string; total: number; qtd: number }> = {};
  for (let i = 0; i < meses; i++) {
    const d = new Date(desde);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    });
    buckets[key] = { mes: label, total: 0, qtd: 0 };
  }
  (data ?? []).forEach((v) => {
    if (!v.data) return;
    const d = new Date(v.data);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets[key]) {
      buckets[key].total += Number(v.valor ?? 0);
      buckets[key].qtd += 1;
    }
  });
  return Object.values(buckets);
}

export async function getGastosPorLoteamento(filtro?: FiltroLote) {
  const supabase = await createClient();
  let loteamentosQuery = supabase.from("loteamentos").select("id, nome");
  if (filtro?.loteamentoId) {
    loteamentosQuery = loteamentosQuery.eq("id", filtro.loteamentoId);
  }
  const { data: loteamentos } = await loteamentosQuery;
  if (!loteamentos) return [];

  // Se filtrar por lote específico, restringe aos lotes desse filtro
  const restritoLoteIds = filtro?.loteId
    ? await resolverLoteIds(filtro)
    : null;

  const results = await Promise.all(
    loteamentos.map(async (lot) => {
      const { data: quadras } = await supabase
        .from("quadras")
        .select("id")
        .eq("loteamento_id", lot.id);
      const quadraIds = quadras?.map((q) => q.id) ?? [];
      if (quadraIds.length === 0) return { nome: lot.nome, total: 0 };

      const { data: lotes } = await supabase
        .from("lotes")
        .select("id")
        .in("quadra_id", quadraIds);
      let loteIds = lotes?.map((l) => l.id) ?? [];
      if (restritoLoteIds !== null) {
        loteIds = loteIds.filter((id) => restritoLoteIds.includes(id));
      }
      if (loteIds.length === 0) return { nome: lot.nome, total: 0 };

      const { data: mats } = await supabase
        .from("lancamentos_material")
        .select("tipo, valor_total")
        .in("lote_id", loteIds);
      const matTotal = (mats ?? []).reduce(
        (s, m) => s + (m.tipo === "saida" ? Number(m.valor_total) : 0),
        0,
      );
      const { data: alocs } = await supabase
        .from("alocacoes")
        .select("valor_pago")
        .in("lote_id", loteIds);
      const alocTotal = (alocs ?? []).reduce(
        (s, a) => s + Number(a.valor_pago ?? 0),
        0,
      );
      return { nome: lot.nome, total: matTotal + alocTotal };
    }),
  );
  return results.sort((a, b) => b.total - a.total);
}

export async function getDistribuicaoStatusLotes(filtro?: FiltroLote) {
  const supabase = await createClient();
  const loteIds = filtro ? await resolverLoteIds(filtro) : null;

  let query = supabase.from("lotes").select("status, id");
  if (loteIds !== null) {
    if (loteIds.length === 0) {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    } else {
      query = query.in("id", loteIds);
    }
  }
  const { data } = await query;

  const counts: Record<string, number> = {
    disponivel: 0,
    reservado: 0,
    vendido: 0,
  };
  (data ?? []).forEach((l) => {
    const s = (l as { status: string }).status;
    counts[s] = (counts[s] ?? 0) + 1;
  });
  return [
    {
      nome: "Disponíveis",
      valor: counts.disponivel,
      cor: "hsl(var(--success))",
    },
    {
      nome: "Reservados",
      valor: counts.reservado,
      cor: "hsl(var(--warning))",
    },
    {
      nome: "Vendidos",
      valor: counts.vendido,
      cor: "hsl(var(--primary))",
    },
  ];
}

export interface ObraAtrasada {
  id: string;
  numero: string;
  previsao_entrega: string | null;
  etapa: string | null;
  status: string;
  quadra: {
    identificador: string;
    loteamento?: { nome: string };
  } | null;
}

export async function getObrasAtrasadas(
  filtro?: FiltroLote,
): Promise<ObraAtrasada[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const loteIds = filtro ? await resolverLoteIds(filtro) : null;

  let query = supabase
    .from("lotes")
    .select(
      "id, numero, previsao_entrega, etapa, status, quadra:quadras(identificador, loteamento:loteamentos(nome))",
    )
    .lt("previsao_entrega", today)
    .neq("etapa", "concluido");
  if (loteIds !== null) {
    if (loteIds.length === 0) return [];
    query = query.in("id", loteIds);
  }
  const { data } = await query;
  return (data ?? []) as unknown as ObraAtrasada[];
}

export async function getGastosMesAtual(filtro?: FiltroLote) {
  const supabase = await createClient();
  const inicio = new Date();
  inicio.setDate(1);
  const inicioStr = inicio.toISOString().slice(0, 10);
  const loteIds = filtro ? await resolverLoteIds(filtro) : null;

  let query = supabase
    .from("lancamentos_material")
    .select("tipo, valor_total, data, lote_id")
    .eq("tipo", "saida")
    .gte("data", inicioStr);
  if (loteIds !== null) {
    if (loteIds.length === 0) return 0;
    query = query.in("lote_id", loteIds);
  }
  const { data: mats } = await query;
  return (mats ?? []).reduce((s, m) => s + Number(m.valor_total), 0);
}
