import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusLoteamentoBadge } from "@/components/status-badge";
import { formatPercent } from "@/lib/utils";

interface LoteamentoCardProps {
  loteamento: {
    id: string;
    nome: string;
    cidade: string | null;
    estado: string | null;
    imagem_url: string | null;
    status: "planejamento" | "em_obra" | "concluido" | "pausado" | null;
    total_lotes: number;
    disponiveis: number;
    reservados: number;
    vendidos: number;
  };
}

export function LoteamentoCard({ loteamento }: LoteamentoCardProps) {
  const pct =
    loteamento.total_lotes > 0
      ? (loteamento.vendidos / loteamento.total_lotes) * 100
      : 0;

  return (
    <Link href={`/loteamentos/${loteamento.id}`} className="group block">
      <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
          {loteamento.imagem_url ? (
            <Image
              src={loteamento.imagem_url}
              alt={loteamento.nome}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-12 w-12 text-primary/40" />
            </div>
          )}
          <div className="absolute right-3 top-3">
            <StatusLoteamentoBadge status={loteamento.status ?? "planejamento"} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-1 text-base font-semibold text-foreground">
            {loteamento.nome}
          </h3>
          {(loteamento.cidade || loteamento.estado) && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {[loteamento.cidade, loteamento.estado].filter(Boolean).join(" / ")}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex flex-1 gap-2">
              <Stat label="Total" value={loteamento.total_lotes} />
              <Stat
                label="Vend."
                value={loteamento.vendidos}
                colorClass="text-primary"
              />
              <Stat
                label="Resv."
                value={loteamento.reservados}
                colorClass="text-warning"
              />
              <Stat
                label="Disp."
                value={loteamento.disponiveis}
                colorClass="text-success"
              />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              % Vendido
            </span>
            <span className="text-sm font-bold text-primary">
              {formatPercent(pct, 0)}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Stat({
  label,
  value,
  colorClass = "text-foreground",
}: {
  label: string;
  value: number;
  colorClass?: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-base font-bold ${colorClass}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
