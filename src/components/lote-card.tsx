import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusLoteBadge } from "@/components/status-badge";
import { ETAPAS_OBRA, type StatusLote, type EtapaObra } from "@/lib/constants";
import { formatBRL, cn } from "@/lib/utils";

interface LoteCardProps {
  lote: {
    id: string;
    numero: string;
    status: StatusLote;
    etapa: EtapaObra | null;
    foto_url: string | null;
    valor_venda: number | null;
    area_construida: number | null;
    quartos: number | null;
  };
}

const statusBgClass: Record<StatusLote, string> = {
  disponivel: "bg-success",
  reservado: "bg-warning",
  vendido: "bg-primary",
};

export function LoteCard({ lote }: LoteCardProps) {
  const etapaCfg = ETAPAS_OBRA[lote.etapa ?? "planejamento"];
  return (
    <Link href={`/lotes/${lote.id}`} className="group block">
      <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
          {lote.foto_url ? (
            <Image
              src={lote.foto_url}
              alt={`Lote ${lote.numero}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Home className="h-10 w-10 text-primary/40" />
            </div>
          )}
          <div
            className={cn(
              "absolute left-0 top-0 px-3 py-1 text-xs font-bold text-white shadow-md",
              statusBgClass[lote.status],
            )}
          >
            Lote {lote.numero}
          </div>
          <div className="absolute right-2 top-2">
            <StatusLoteBadge status={lote.status} />
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Lote {lote.numero}
            </h3>
            {lote.valor_venda && (
              <span className="text-xs font-bold text-primary">
                {formatBRL(lote.valor_venda)}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
            {lote.area_construida && (
              <span>{lote.area_construida}m²</span>
            )}
            {lote.quartos != null && (
              <span>{lote.quartos} quarto{lote.quartos !== 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{etapaCfg.label}</span>
              <span className="font-semibold">{etapaCfg.percent}%</span>
            </div>
            <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", statusBgClass[lote.status])}
                style={{ width: `${etapaCfg.percent}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
