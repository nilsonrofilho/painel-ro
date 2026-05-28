import { createClient } from "@/lib/supabase/server";
import { ETAPAS_OBRA } from "@/lib/constants";

export interface GanttTask {
  id: string;
  loteId: string;
  loteamentoId: string;
  loteamentoNome: string;
  quadraIdentificador: string;
  numero: string;
  label: string;
  start: Date;
  end: Date;
  endReal: Date | null;
  status: "disponivel" | "reservado" | "vendido";
  etapa: keyof typeof ETAPAS_OBRA | null;
  etapaPercent: number;
  isAtrasada: boolean;
}

export interface GanttGroup {
  loteamentoId: string;
  loteamentoNome: string;
  tasks: GanttTask[];
}

export async function getGanttData(): Promise<{
  groups: GanttGroup[];
  minDate: Date;
  maxDate: Date;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lotes")
    .select(
      "id, numero, status, etapa, data_inicio_obra, previsao_entrega, data_entrega_real, quadra:quadras(identificador, loteamento:loteamentos(id, nome, data_inicio, previsao_entrega))",
    )
    .order("created_at", { ascending: true });

  const today = new Date();
  const tasks: GanttTask[] = [];

  for (const l of data ?? []) {
    const quadra = l.quadra as unknown as {
      identificador: string;
      loteamento?: {
        id: string;
        nome: string;
        data_inicio: string | null;
        previsao_entrega: string | null;
      };
    } | null;
    if (!quadra?.loteamento) continue;

    // Prefere a data de início específica do lote; cai pra do loteamento
    const start = l.data_inicio_obra
      ? new Date(l.data_inicio_obra)
      : quadra.loteamento.data_inicio
        ? new Date(quadra.loteamento.data_inicio)
        : null;
    const end = l.previsao_entrega
      ? new Date(l.previsao_entrega)
      : quadra.loteamento.previsao_entrega
        ? new Date(quadra.loteamento.previsao_entrega)
        : null;

    if (!start || !end) continue;

    const endReal = l.data_entrega_real ? new Date(l.data_entrega_real) : null;
    const etapaPct = l.etapa ? ETAPAS_OBRA[l.etapa as keyof typeof ETAPAS_OBRA]?.percent ?? 0 : 0;
    const isAtrasada = end < today && etapaPct < 100;

    tasks.push({
      id: l.id,
      loteId: l.id,
      loteamentoId: quadra.loteamento.id,
      loteamentoNome: quadra.loteamento.nome,
      quadraIdentificador: quadra.identificador,
      numero: l.numero,
      label: `Lote ${l.numero} — Q. ${quadra.identificador}`,
      start,
      end,
      endReal,
      status: l.status,
      etapa: l.etapa as keyof typeof ETAPAS_OBRA | null,
      etapaPercent: etapaPct,
      isAtrasada,
    });
  }

  // Agrupa por loteamento
  const groupMap = new Map<string, GanttGroup>();
  for (const t of tasks) {
    let g = groupMap.get(t.loteamentoId);
    if (!g) {
      g = {
        loteamentoId: t.loteamentoId,
        loteamentoNome: t.loteamentoNome,
        tasks: [],
      };
      groupMap.set(t.loteamentoId, g);
    }
    g.tasks.push(t);
  }
  const groups = Array.from(groupMap.values()).sort((a, b) =>
    a.loteamentoNome.localeCompare(b.loteamentoNome),
  );

  // Eixo X
  let minDate = new Date();
  let maxDate = new Date();
  if (tasks.length > 0) {
    minDate = new Date(Math.min(...tasks.map((t) => t.start.getTime())));
    maxDate = new Date(
      Math.max(...tasks.map((t) => (t.endReal ?? t.end).getTime())),
    );
    // padding 1 mês
    minDate.setDate(1);
    maxDate.setMonth(maxDate.getMonth() + 1, 0);
  }

  return { groups, minDate, maxDate };
}
