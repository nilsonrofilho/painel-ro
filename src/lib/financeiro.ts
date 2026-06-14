/**
 * Painel RO — Motor de cálculo financeiro (puro, sem IO).
 * Fluxo de caixa (diário/semanal/mensal) e DRE gerencial.
 * Regime de caixa: realizado por data de pagamento; projetado por vencimento.
 */

export interface LancamentoFin {
  tipo: "pagar" | "receber";
  valor: number;
  valor_pago: number | null;
  status: "pendente" | "pago" | "cancelado";
  data_vencimento: string;
  data_pagamento: string | null;
  categoria: string;
  loteamento_id: string | null;
  lote_id: string | null;
}

export type Granularidade = "dia" | "semana" | "mes";

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Valor efetivo: pago usa valor_pago (cai no valor), pendente usa valor previsto. */
function valorEfetivo(l: LancamentoFin): number {
  if (l.status === "pago") return num(l.valor_pago ?? l.valor);
  return num(l.valor);
}

/** Data que entra no fluxo: pago → data_pagamento; senão → vencimento. */
function dataFluxo(l: LancamentoFin): string {
  if (l.status === "pago" && l.data_pagamento) return l.data_pagamento;
  return l.data_vencimento;
}

/** Início do bucket (YYYY-MM-DD) conforme granularidade. */
function bucketKey(dataISO: string, g: Granularidade): string {
  const d = new Date(dataISO + "T00:00:00");
  if (g === "dia") return dataISO;
  if (g === "mes") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  }
  // semana: segunda-feira da semana (ISO)
  const dow = (d.getDay() + 6) % 7; // 0 = segunda
  const seg = new Date(d);
  seg.setDate(d.getDate() - dow);
  return seg.toISOString().slice(0, 10);
}

function rotuloBucket(chave: string, g: Granularidade): string {
  const d = new Date(chave + "T00:00:00");
  if (g === "mes") {
    return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  }
  if (g === "semana") {
    return `Sem. ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export interface FluxoBucket {
  chave: string;
  rotulo: string;
  entradas: number;
  saidas: number;
  saldo: number;
  acumulado: number;
  ruptura: boolean; // acumulado < 0
}

/**
 * Constrói a série de fluxo de caixa a partir dos lançamentos não-cancelados.
 * saldoInicial é o caixa atual informado pelo usuário.
 */
export function construirFluxoCaixa(
  saldoInicial: number,
  lancamentos: LancamentoFin[],
  granularidade: Granularidade,
): FluxoBucket[] {
  const buckets = new Map<string, { entradas: number; saidas: number }>();

  for (const l of lancamentos) {
    if (l.status === "cancelado") continue;
    const chave = bucketKey(dataFluxo(l), granularidade);
    const b = buckets.get(chave) ?? { entradas: 0, saidas: 0 };
    const v = valorEfetivo(l);
    if (l.tipo === "receber") b.entradas += v;
    else b.saidas += v;
    buckets.set(chave, b);
  }

  const chaves = Array.from(buckets.keys()).sort();
  let acumulado = num(saldoInicial);
  return chaves.map((chave) => {
    const b = buckets.get(chave)!;
    const saldo = b.entradas - b.saidas;
    acumulado += saldo;
    return {
      chave,
      rotulo: rotuloBucket(chave, granularidade),
      entradas: b.entradas,
      saidas: b.saidas,
      saldo,
      acumulado,
      ruptura: acumulado < 0,
    };
  });
}

// ============================================================
// DRE gerencial
// ============================================================
export interface LinhaDRE {
  natureza: "receita" | "custo_direto" | "despesa_operacional";
  categoria: string;
  loteamento_id: string | null;
  lote_id: string | null;
  valor: number; // sempre positivo; o sinal vem da natureza
}

export interface ResultadoDRE {
  receitas: number;
  custosDirectos: number;
  lucroBruto: number;
  despesasOperacionais: number;
  resultadoLiquido: number;
  margemBrutaPct: number;
  margemLiquidaPct: number;
  porCategoria: { categoria: string; natureza: string; valor: number }[];
}

export function calcularDRE(linhas: LinhaDRE[]): ResultadoDRE {
  let receitas = 0;
  let custosDirectos = 0;
  let despesasOperacionais = 0;
  const catMap = new Map<string, { natureza: string; valor: number }>();

  for (const l of linhas) {
    const v = num(l.valor);
    if (l.natureza === "receita") receitas += v;
    else if (l.natureza === "custo_direto") custosDirectos += v;
    else despesasOperacionais += v;

    const chave = `${l.natureza}:${l.categoria}`;
    const c = catMap.get(chave) ?? { natureza: l.natureza, valor: 0 };
    c.valor += v;
    catMap.set(chave, c);
  }

  const lucroBruto = receitas - custosDirectos;
  const resultadoLiquido = lucroBruto - despesasOperacionais;

  return {
    receitas,
    custosDirectos,
    lucroBruto,
    despesasOperacionais,
    resultadoLiquido,
    margemBrutaPct: receitas > 0 ? (lucroBruto / receitas) * 100 : 0,
    margemLiquidaPct: receitas > 0 ? (resultadoLiquido / receitas) * 100 : 0,
    porCategoria: Array.from(catMap.entries()).map(([chave, v]) => ({
      categoria: chave.split(":")[1],
      natureza: v.natureza,
      valor: v.valor,
    })),
  };
}

/** Situação derivada de um lançamento (pendente vencido = atrasado). */
export function situacaoLancamento(l: {
  status: string;
  data_vencimento: string;
}): "pago" | "cancelado" | "atrasado" | "pendente" {
  if (l.status === "pago") return "pago";
  if (l.status === "cancelado") return "cancelado";
  const hoje = new Date().toISOString().slice(0, 10);
  if (l.data_vencimento < hoje) return "atrasado";
  return "pendente";
}
