// Cronograma de obra — encadeamento automático de datas das fases.
//
// Módulo PURO (sem I/O): recebe as fases e a data de início da obra, devolve
// as datas calculadas. Fonte única de verdade para o cálculo, fácil de testar.
//
// Regra: a fase sem predecessora começa na data de início da obra; cada fase
// começa quando a sua predecessora termina; data_fim = data_inicio + duração.
// Ordenação topológica por predecessora_id, com fallback por `ordem`.

// Durações padrão (em dias) por nome de fase — usadas no seed e quando a fase
// não tem duracao_dias definida.
export const DURACOES_PADRAO_FASE: Record<string, number> = {
  Planejamento: 7,
  "Serviços preliminares": 10,
  Fundação: 15,
  Alvenaria: 30,
  Cobertura: 15,
  Acabamento: 30,
  Concluído: 5,
  "Documentação Final": 15,
};

export const DURACAO_FASE_FALLBACK = 15;

export interface FaseCronograma {
  id: string;
  nome: string;
  ordem: number;
  duracao_dias: number | null;
  predecessora_id: string | null;
  data_inicio: string | null;
  data_fim: string | null;
}

export interface DatasCalculadas {
  id: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
}

/** Duração efetiva de uma fase: a sua, ou o padrão pelo nome, ou o fallback. */
export function duracaoDaFase(nome: string, duracaoDias: number | null): number {
  if (duracaoDias != null && duracaoDias > 0) return duracaoDias;
  return DURACOES_PADRAO_FASE[nome] ?? DURACAO_FASE_FALLBACK;
}

// --- helpers de data em UTC (datas são "YYYY-MM-DD", sem fuso) ---

function parseDia(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDia(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDias(iso: string, dias: number): string {
  const d = parseDia(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return formatDia(d);
}

/**
 * Calcula início/fim de cada fase encadeando pelas durações.
 *
 * @param fases  fases do lote (qualquer ordem; serão ordenadas)
 * @param dataInicioObra data de início da obra (YYYY-MM-DD). Se ausente, usa a
 *   menor data_inicio já preenchida nas fases; se nada houver, retorna [].
 * @returns datas calculadas por fase (ordem topológica)
 */
export function calcularCronograma(
  fases: FaseCronograma[],
  dataInicioObra: string | null,
): DatasCalculadas[] {
  if (fases.length === 0) return [];

  const inicioBase =
    dataInicioObra ??
    fases
      .map((f) => f.data_inicio)
      .filter((d): d is string => Boolean(d))
      .sort()[0] ??
    null;
  if (!inicioBase) return [];

  // Ordenação: respeita predecessora_id (topológica) com fallback por `ordem`.
  const ordenadas = ordenarFases(fases);

  const fimPorId = new Map<string, string>();
  const resultado: DatasCalculadas[] = [];

  for (const fase of ordenadas) {
    const dur = duracaoDaFase(fase.nome, fase.duracao_dias);
    let inicio: string;
    if (fase.predecessora_id && fimPorId.has(fase.predecessora_id)) {
      // começa no dia seguinte ao fim da predecessora
      inicio = addDias(fimPorId.get(fase.predecessora_id)!, 1);
    } else {
      // sem predecessora (ou predecessora fora da lista): início da obra
      inicio = inicioBase;
    }
    const fim = addDias(inicio, Math.max(0, dur - 1));
    fimPorId.set(fase.id, fim);
    resultado.push({ id: fase.id, data_inicio: inicio, data_fim: fim });
  }

  return resultado;
}

/**
 * Ordena topologicamente por predecessora_id. Se houver ciclo ou predecessora
 * inexistente, cai no fallback por `ordem`. Estável e determinístico.
 */
function ordenarFases(fases: FaseCronograma[]): FaseCronograma[] {
  const porId = new Map(fases.map((f) => [f.id, f]));
  const visitadas = new Set<string>();
  const emProcesso = new Set<string>();
  const saida: FaseCronograma[] = [];

  // ordem base por `ordem` para determinismo
  const base = [...fases].sort((a, b) => a.ordem - b.ordem);

  function visitar(f: FaseCronograma): boolean {
    if (visitadas.has(f.id)) return true;
    if (emProcesso.has(f.id)) return false; // ciclo
    emProcesso.add(f.id);
    if (f.predecessora_id) {
      const pred = porId.get(f.predecessora_id);
      if (pred && !visitar(pred)) {
        // ciclo detectado: aborta topológica
        emProcesso.delete(f.id);
        return false;
      }
    }
    emProcesso.delete(f.id);
    visitadas.add(f.id);
    saida.push(f);
    return true;
  }

  for (const f of base) {
    if (!visitar(f)) {
      // ciclo: fallback total por `ordem`
      return base;
    }
  }
  return saida;
}
