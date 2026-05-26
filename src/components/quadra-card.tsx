import Link from "next/link";
import { Layers } from "lucide-react";
import { Card } from "@/components/ui/card";

interface QuadraCardProps {
  href: string;
  quadra: {
    id: string;
    identificador: string;
    descricao: string | null;
    total_lotes: number;
    disponiveis: number;
    reservados: number;
    vendidos: number;
  };
}

export function QuadraCard({ href, quadra }: QuadraCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            {quadra.identificador}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground">
              Quadra {quadra.identificador}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {quadra.descricao || `${quadra.total_lotes} lote(s)`}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3 text-muted-foreground" />
                <strong>{quadra.total_lotes}</strong>
              </span>
              <span className="flex items-center gap-1 text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {quadra.disponiveis}
              </span>
              <span className="flex items-center gap-1 text-warning">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                {quadra.reservados}
              </span>
              <span className="flex items-center gap-1 text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {quadra.vendidos}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
