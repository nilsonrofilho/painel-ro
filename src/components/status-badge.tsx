import { Badge } from "@/components/ui/badge";
import { STATUS_LOTE, STATUS_LOTEAMENTO, type StatusLote, type StatusLoteamento } from "@/lib/constants";

interface StatusLoteBadgeProps {
  status: StatusLote;
  className?: string;
}

export function StatusLoteBadge({ status, className }: StatusLoteBadgeProps) {
  const cfg = STATUS_LOTE[status];
  const variant =
    status === "disponivel"
      ? "success"
      : status === "reservado"
        ? "warning"
        : "default";
  return (
    <Badge variant={variant} className={className}>
      <span className="text-[10px]">{cfg.emoji}</span>
      {cfg.label}
    </Badge>
  );
}

interface StatusLoteamentoBadgeProps {
  status: StatusLoteamento;
  className?: string;
}

export function StatusLoteamentoBadge({ status, className }: StatusLoteamentoBadgeProps) {
  const cfg = STATUS_LOTEAMENTO[status];
  const variant =
    status === "em_obra"
      ? "warning"
      : status === "concluido"
        ? "success"
        : status === "pausado"
          ? "destructive"
          : "muted";
  return (
    <Badge variant={variant} className={className}>
      {cfg.label}
    </Badge>
  );
}
