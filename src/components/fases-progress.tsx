import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { FaseObra } from "@/lib/supabase/types";

interface FasesProgressProps {
  fases: FaseObra[];
  className?: string;
}

/**
 * Barra de progresso da obra baseada nas FASES REAIS do lote (fases_obra),
 * não no campo legado lote.etapa. Mostra cada fase com seu status e o % =
 * fases concluídas / total. Fonte única, alinhada com a aba e a página global.
 */
export function FasesProgress({ fases, className }: FasesProgressProps) {
  if (fases.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Nenhuma fase cadastrada
          </span>
        </div>
        <Progress value={0} indicatorClassName="bg-muted" />
      </div>
    );
  }

  const ordenadas = [...fases].sort((a, b) => a.ordem - b.ordem);
  const concluidas = ordenadas.filter((f) => f.status === "concluida").length;
  const pct = Math.round((concluidas / ordenadas.length) * 100);
  const emAndamento = ordenadas.find((f) => f.status === "em_andamento");
  const proxima = ordenadas.find((f) => f.status !== "concluida");
  const rotulo =
    pct >= 100
      ? "Concluído"
      : emAndamento
        ? emAndamento.nome
        : (proxima?.nome ?? "Em andamento");

  const indicator =
    pct >= 100
      ? "bg-success"
      : pct >= 60
        ? "bg-accent"
        : pct >= 30
          ? "bg-warning"
          : "bg-primary";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{rotulo}</span>
        <span className="text-xs font-semibold text-muted-foreground">
          {concluidas}/{ordenadas.length} · {pct}%
        </span>
      </div>
      <Progress value={pct} indicatorClassName={indicator} />
      <div
        className="mt-3 grid gap-1 text-[10px] font-medium"
        style={{
          gridTemplateColumns: `repeat(${ordenadas.length}, minmax(0, 1fr))`,
        }}
      >
        {ordenadas.map((f) => {
          const ativa = f.status === "concluida";
          const andamento = f.status === "em_andamento";
          return (
            <div
              key={f.id}
              className={cn(
                "flex flex-col items-center gap-1",
                ativa || andamento
                  ? "text-foreground"
                  : "text-muted-foreground/60",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  ativa
                    ? "bg-success"
                    : andamento
                      ? "bg-warning"
                      : "bg-muted",
                )}
              />
              <span className="text-center leading-tight">{f.nome}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
