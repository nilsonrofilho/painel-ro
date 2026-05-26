import { GanttChartSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { GanttChart } from "@/components/gantt-chart";
import { getGanttData } from "@/lib/gantt";

export const dynamic = "force-dynamic";

export default async function GanttPage() {
  const { groups, minDate, maxDate } = await getGanttData();
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

      <Card>
        <CardContent className="p-4 sm:p-5">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <GanttChartSquare className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">Sem dados para o cronograma</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Para visualizar lotes no Gantt, cadastre o loteamento com{" "}
                <strong>data de início</strong> e cada lote com{" "}
                <strong>previsão de entrega</strong>. A barra é colorida pelo
                status e a porção preenchida representa a etapa atual da obra.
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
