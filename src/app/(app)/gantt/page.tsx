import { GanttChartSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { GanttChart } from "@/components/gantt-chart";
import { FiltroLoteamentoLote } from "@/components/filtro-loteamento-lote";
import { getGanttData } from "@/lib/gantt";
import { getOpcoesFiltro, parseFiltro } from "@/lib/filters";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ loteamento?: string; lote?: string }>;
}

export default async function GanttPage({ searchParams }: Props) {
  const filtro = parseFiltro(await searchParams);
  const [{ groups, minDate, maxDate }, opcoes] = await Promise.all([
    getGanttData(filtro),
    getOpcoesFiltro(),
  ]);
  const totalTasks = groups.reduce((s, g) => s + g.tasks.length, 0);
  const atrasadas = groups
    .flatMap((g) => g.tasks)
    .filter((t) => t.isAtrasada).length;

  return (
    <>
      <PageHeader
        title="Gantt de Obras"
        description={`${totalTasks} lote(s) em ${groups.length} loteamento(s)${atrasadas > 0 ? ` · ${atrasadas} atrasada(s)` : ""}`}
      />

      <div className="mb-4">
        <FiltroLoteamentoLote
          loteamentos={opcoes.loteamentos}
          lotes={opcoes.lotes}
        />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <GanttChartSquare className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">Sem dados para o cronograma</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                {filtro.loteamentoId || filtro.loteId
                  ? "Nenhum lote corresponde ao filtro selecionado, ou os lotes não têm datas de início/entrega definidas."
                  : "Para visualizar lotes no Gantt, cadastre o loteamento com data de início e cada lote com previsão de entrega. A barra é colorida pelo status e a porção preenchida representa a etapa atual da obra."}
              </p>
            </div>
          ) : (
            <GanttChart
              groups={groups}
              minDate={minDate}
              maxDate={maxDate}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
