/**
 * Painel RO — Motor de cálculo de viabilidade econômica.
 *
 * Funções PURAS (sem IO). Fonte única de verdade dos cálculos: usada pelas
 * abas (via useMemo) e por qualquer relatório. Arredondamento só na exibição
 * (formatBRL/formatPercent) — aqui tudo permanece em float para não acumular
 * erro em VPL/TIR.
 */

// ============================================================
// Potencial construtivo
// ============================================================
export interface PotencialInput {
  areaTerreno: number;
  toPct: number; // taxa de ocupação %
  caBasico: number;
  caMaximo?: number | null;
  caPretendido?: number | null;
  taxaPermeabilidadePct?: number | null;
  fatorEficiencia?: number | null; // 0.70–0.85
}

export interface PotencialResult {
  areaProjecaoMax: number;
  areaConstruivelBasico: number;
  areaConstruivelMaximo: number;
  areaConstruivelPretendida: number;
  pavimentosEstimados: number;
  areaPermeavelMin: number;
  areaPrivativaVendavel: number;
}

export function calcPotencialConstrutivo(i: PotencialInput): PotencialResult {
  const area = num(i.areaTerreno);
  const areaProjecaoMax = area * (num(i.toPct) / 100);
  const areaConstruivelBasico = area * num(i.caBasico);
  const caMax = i.caMaximo != null ? num(i.caMaximo) : num(i.caBasico);
  const areaConstruivelMaximo = area * caMax;
  const caPret = i.caPretendido != null ? num(i.caPretendido) : num(i.caBasico);
  const caPretClamp = Math.min(caPret, caMax || caPret);
  const areaConstruivelPretendida = area * caPretClamp;
  const pavimentosEstimados =
    areaProjecaoMax > 0
      ? Math.ceil(areaConstruivelPretendida / areaProjecaoMax)
      : 0;
  const areaPermeavelMin = area * (num(i.taxaPermeabilidadePct) / 100);
  const fator = i.fatorEficiencia != null ? num(i.fatorEficiencia) : 0.8;
  const areaPrivativaVendavel = areaConstruivelPretendida * fator;

  return {
    areaProjecaoMax,
    areaConstruivelBasico,
    areaConstruivelMaximo,
    areaConstruivelPretendida,
    pavimentosEstimados,
    areaPermeavelMin,
    areaPrivativaVendavel,
  };
}

// ============================================================
// Outorga onerosa (OODC)
// ============================================================
export function calcOutorga(input: {
  areaTerreno: number;
  caBasico: number;
  caPretendido?: number | null;
  permiteOutorga?: boolean | null;
  valorM2TerrenoPgv?: number | null;
  fatorFp?: number | null;
  fatorFs?: number | null;
}): number {
  if (!input.permiteOutorga) return 0;
  const caPret = input.caPretendido != null ? num(input.caPretendido) : 0;
  const areaAdicional =
    Math.max(0, caPret - num(input.caBasico)) * num(input.areaTerreno);
  if (areaAdicional <= 0) return 0;
  const fp = input.fatorFp != null ? num(input.fatorFp) : 1;
  const fs = input.fatorFs != null ? num(input.fatorFs) : 1;
  return areaAdicional * num(input.valorM2TerrenoPgv) * fp * fs;
}

// ============================================================
// ITBI e custo de aquisição
// ============================================================
export function calcITBI(input: {
  base: "valor_transacao" | "valor_venal" | "maior_entre";
  custoTerreno: number;
  valorVenalReferencia?: number | null;
  aliquotaPct: number;
}): { baseCalculo: number; valor: number } {
  const custo = num(input.custoTerreno);
  const venal = num(input.valorVenalReferencia);
  let base: number;
  if (input.base === "valor_venal") base = venal;
  else if (input.base === "maior_entre") base = Math.max(custo, venal);
  else base = custo;
  const valor = base * (num(input.aliquotaPct) / 100);
  return { baseCalculo: base, valor };
}

export function calcCustoAquisicao(input: {
  custoTerreno: number;
  itbiValor: number;
  outorgaValor: number;
  custosCartorio: number;
}): number {
  return (
    num(input.custoTerreno) +
    num(input.itbiValor) +
    num(input.outorgaValor) +
    num(input.custosCartorio)
  );
}

// ============================================================
// VGV e custo de obra (a partir do programa)
// ============================================================
export interface UnidadePrograma {
  quantidade: number;
  area_privativa_m2?: number | null;
  area_construida_m2?: number | null;
  preco_m2_venda?: number | null;
  valor_venda_unitario?: number | null;
}

export function vgvUnidade(u: UnidadePrograma): number {
  const qtd = num(u.quantidade);
  if (u.valor_venda_unitario != null && num(u.valor_venda_unitario) > 0) {
    return qtd * num(u.valor_venda_unitario);
  }
  return qtd * num(u.area_privativa_m2) * num(u.preco_m2_venda);
}

export function calcVGV(programa: UnidadePrograma[]): number {
  return programa.reduce((s, u) => s + vgvUnidade(u), 0);
}

export function calcCustoObra(
  programa: UnidadePrograma[],
  cubM2: number,
  bdiPct: number,
): number {
  const fator = 1 + num(bdiPct) / 100;
  return programa.reduce(
    (s, u) =>
      s + num(u.quantidade) * num(u.area_construida_m2) * num(cubM2) * fator,
    0,
  );
}

// ============================================================
// Demonstrativo de resultado
// ============================================================
export interface DemonstrativoInput {
  vgv: number;
  custoAquisicao: number;
  custoObra: number;
  custoInfraestrutura: number;
  custosIndiretosPct: number;
  custoFinanceiro: number;
  comissaoVendaPct: number;
  impostoVendaPct: number;
  distratosPct: number;
}

export interface DemonstrativoResult {
  vgv: number;
  custoDireto: number;
  custosIndiretos: number;
  custoTotal: number;
  deducoesVenda: number;
  receitaLiquida: number;
  lucro: number;
  margemVgvPct: number;
  roiPct: number;
}

export function calcDemonstrativo(i: DemonstrativoInput): DemonstrativoResult {
  const vgv = num(i.vgv);
  const custoDireto =
    num(i.custoAquisicao) + num(i.custoObra) + num(i.custoInfraestrutura);
  const custosIndiretos = custoDireto * (num(i.custosIndiretosPct) / 100);
  const custoTotal = custoDireto + custosIndiretos + num(i.custoFinanceiro);
  const deducoesVenda =
    vgv *
    ((num(i.comissaoVendaPct) + num(i.impostoVendaPct) + num(i.distratosPct)) /
      100);
  const receitaLiquida = vgv - deducoesVenda;
  const lucro = receitaLiquida - custoTotal;
  const margemVgvPct = vgv > 0 ? (lucro / vgv) * 100 : 0;
  const roiPct = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

  return {
    vgv,
    custoDireto,
    custosIndiretos,
    custoTotal,
    deducoesVenda,
    receitaLiquida,
    lucro,
    margemVgvPct,
    roiPct,
  };
}

// ============================================================
// Indicadores de fluxo de caixa (VPL, TIR, payback, exposição)
// ============================================================
export interface FluxoPeriodo {
  periodo: number;
  entradas: number;
  saidas: number;
}

/** Fluxos líquidos ordenados por período (mês 0..n). */
function fcOrdenado(fluxo: FluxoPeriodo[]): number[] {
  return [...fluxo]
    .sort((a, b) => a.periodo - b.periodo)
    .map((f) => num(f.entradas) - num(f.saidas));
}

/** Taxa mensal equivalente a uma TMA anual. */
export function tmaMensal(tmaAnualPct: number): number {
  return Math.pow(1 + num(tmaAnualPct) / 100, 1 / 12) - 1;
}

/** Valor Presente Líquido dado fluxos mensais e taxa mensal. */
export function calcVPL(fluxo: FluxoPeriodo[], taxaMensal: number): number {
  const fcs = fcOrdenado(fluxo);
  return fcs.reduce((s, fc, t) => s + fc / Math.pow(1 + taxaMensal, t), 0);
}

function vplDeFluxos(fcs: number[], taxa: number): number {
  return fcs.reduce((s, fc, t) => s + fc / Math.pow(1 + taxa, t), 0);
}

/**
 * TIR mensal por bissecção com bracketing robusto. Retorna null se não
 * convergir (fluxo sem troca de sinal, múltiplas raízes problemáticas, etc.).
 */
export function calcTIRMensal(fluxo: FluxoPeriodo[]): number | null {
  const fcs = fcOrdenado(fluxo);
  if (fcs.length < 2) return null;
  const temPositivo = fcs.some((v) => v > 0);
  const temNegativo = fcs.some((v) => v < 0);
  if (!temPositivo || !temNegativo) return null; // sem troca de sinal → sem TIR

  let lo = -0.9999; // taxa não pode ser <= -100%
  let hi = 10; // 1000% a.m. como teto
  let fLo = vplDeFluxos(fcs, lo);
  let fHi = vplDeFluxos(fcs, hi);

  // Expande o teto se ainda não houver bracketing
  let tentativas = 0;
  while (fLo * fHi > 0 && hi < 1e6 && tentativas < 60) {
    hi *= 2;
    fHi = vplDeFluxos(fcs, hi);
    tentativas++;
  }
  if (fLo * fHi > 0) return null; // não foi possível isolar uma raiz

  for (let iter = 0; iter < 200; iter++) {
    const mid = (lo + hi) / 2;
    const fMid = vplDeFluxos(fcs, mid);
    if (Math.abs(fMid) < 1e-7) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/** TIR anualizada em % (a partir da mensal). null se não convergir. */
export function calcTIRAnualPct(fluxo: FluxoPeriodo[]): number | null {
  const m = calcTIRMensal(fluxo);
  if (m == null) return null;
  return (Math.pow(1 + m, 12) - 1) * 100;
}

/**
 * Payback simples (em períodos), com interpolação linear dentro do período
 * em que o saldo cruza zero. Ex: [-100, 60, 50] → ~1.8. null se nunca recupera.
 */
export function calcPaybackSimples(fluxo: FluxoPeriodo[]): number | null {
  const fcs = fcOrdenado(fluxo);
  let acc = 0;
  for (let t = 0; t < fcs.length; t++) {
    const anterior = acc;
    acc += fcs[t];
    if (acc >= 0) {
      if (t === 0) return 0;
      // fração do período t onde o acumulado cruza zero
      const fracao = fcs[t] !== 0 ? Math.abs(anterior) / Math.abs(fcs[t]) : 0;
      return t - 1 + fracao;
    }
  }
  return null;
}

/** Payback descontado pela taxa mensal. null se nunca recupera. */
export function calcPaybackDescontado(
  fluxo: FluxoPeriodo[],
  taxaMensal: number,
): number | null {
  const fcs = fcOrdenado(fluxo);
  let acc = 0;
  for (let t = 0; t < fcs.length; t++) {
    acc += fcs[t] / Math.pow(1 + taxaMensal, t);
    if (acc >= 0) return t;
  }
  return null;
}

/**
 * Exposição máxima de caixa: maior necessidade de capital próprio ao longo do
 * projeto. Retornada como valor POSITIVO (capital a aportar). 0 se nunca fica
 * negativo.
 */
export function calcExposicaoMaxima(fluxo: FluxoPeriodo[]): number {
  const fcs = fcOrdenado(fluxo);
  let acc = 0;
  let min = 0;
  for (const fc of fcs) {
    acc += fc;
    if (acc < min) min = acc;
  }
  return Math.abs(min); // capital próprio necessário (>= 0)
}

/** Série de saldo acumulado (para gráfico de linha). */
export function saldoAcumulado(
  fluxo: FluxoPeriodo[],
): { periodo: number; rotulo: string; saldo: number }[] {
  const ordenado = [...fluxo].sort((a, b) => a.periodo - b.periodo);
  let acc = 0;
  return ordenado.map((f) => {
    acc += num(f.entradas) - num(f.saidas);
    return {
      periodo: f.periodo,
      rotulo: `M${f.periodo}`,
      saldo: acc,
    };
  });
}

// ============================================================
// Validações urbanísticas (alertas)
// ============================================================
export interface AlertaUrbanistico {
  tipo: "erro" | "aviso" | "info";
  mensagem: string;
}

export function validarUrbanistica(input: {
  caBasico: number;
  caMaximo?: number | null;
  caPretendido?: number | null;
  permiteOutorga?: boolean | null;
  pavimentosEstimados: number;
  peDireito?: number | null;
  gabaritoMaxM?: number | null;
  gabaritoMaxPavimentos?: number | null;
}): AlertaUrbanistico[] {
  const alertas: AlertaUrbanistico[] = [];
  const caPret = input.caPretendido != null ? num(input.caPretendido) : null;
  const caMax = input.caMaximo != null ? num(input.caMaximo) : null;

  if (caPret != null && caMax != null && caPret > caMax) {
    alertas.push({
      tipo: "erro",
      mensagem: `CA pretendido (${caPret}) excede o CA máximo da zona (${caMax}). Inviável sem revisão.`,
    });
  } else if (
    caPret != null &&
    caPret > num(input.caBasico) &&
    (caMax == null || caPret <= caMax)
  ) {
    if (input.permiteOutorga) {
      alertas.push({
        tipo: "aviso",
        mensagem: `CA pretendido acima do básico — exige outorga onerosa (OODC).`,
      });
    } else {
      alertas.push({
        tipo: "erro",
        mensagem: `CA pretendido acima do básico, mas a zona não permite outorga.`,
      });
    }
  }

  const pe = input.peDireito != null ? num(input.peDireito) : 3;
  if (
    input.gabaritoMaxM != null &&
    input.pavimentosEstimados * pe > num(input.gabaritoMaxM)
  ) {
    alertas.push({
      tipo: "aviso",
      mensagem: `Altura estimada (${(input.pavimentosEstimados * pe).toFixed(1)}m) ultrapassa o gabarito máximo (${input.gabaritoMaxM}m).`,
    });
  }
  if (
    input.gabaritoMaxPavimentos != null &&
    input.pavimentosEstimados > num(input.gabaritoMaxPavimentos)
  ) {
    alertas.push({
      tipo: "aviso",
      mensagem: `Pavimentos estimados (${input.pavimentosEstimados}) acima do limite da zona (${input.gabaritoMaxPavimentos}).`,
    });
  }
  return alertas;
}

// ============================================================
// util
// ============================================================
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
