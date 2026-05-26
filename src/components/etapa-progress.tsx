import { Progress } from "@/components/ui/progress";
import { ETAPAS_OBRA, type EtapaObra } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface EtapaProgressProps {
  etapa: EtapaObra | null;
  className?: string;
  showSteps?: boolean;
}

export function EtapaProgress({
  etapa,
  className,
  showSteps = false,
}: EtapaProgressProps) {
  const current = etapa ?? "planejamento";
  const cfg = ETAPAS_OBRA[current];
  const indicator =
    cfg.percent >= 100
      ? "bg-success"
      : cfg.percent >= 60
        ? "bg-accent"
        : cfg.percent >= 30
          ? "bg-warning"
          : "bg-primary";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          {cfg.label}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          {cfg.percent}%
        </span>
      </div>
      <Progress value={cfg.percent} indicatorClassName={indicator} />
      {showSteps && (
        <div className="mt-3 grid grid-cols-6 gap-1 text-[10px] font-medium">
          {(Object.keys(ETAPAS_OBRA) as EtapaObra[]).map((key) => {
            const step = ETAPAS_OBRA[key];
            const active = step.order <= cfg.order;
            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col items-center gap-1",
                  active ? "text-foreground" : "text-muted-foreground/60",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    active ? "bg-primary" : "bg-muted",
                  )}
                />
                <span className="text-center leading-tight">{step.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
