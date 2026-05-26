import Image from "next/image";
import {
  Bed,
  Bath,
  Car,
  Ruler,
  Home as HomeIcon,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Lote } from "@/lib/supabase/types";

interface Props {
  lote: Lote;
}

export function DetalhesTecnicosTab({ lote }: Props) {
  const itens = [
    { icon: Ruler, label: "Área do lote", value: lote.area_lote ? `${lote.area_lote} m²` : "—" },
    {
      icon: HomeIcon,
      label: "Área construída",
      value: lote.area_construida ? `${lote.area_construida} m²` : "—",
    },
    { icon: Bed, label: "Quartos", value: lote.quartos ?? "—" },
    { icon: Sparkles, label: "Suítes", value: lote.suites ?? "—" },
    { icon: Bath, label: "Banheiros", value: lote.banheiros ?? "—" },
    { icon: Car, label: "Vagas", value: lote.vagas ?? "—" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Características</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {itens.map((it) => {
              const Icon = it.icon;
              return (
                <div
                  key={it.label}
                  className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {it.label}
                    </p>
                    <p className="truncate text-base font-semibold text-foreground">
                      {it.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {lote.tipo_planta && (
            <div className="mt-6 rounded-lg border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Tipo de planta
              </p>
              <p className="mt-1 text-base font-medium">{lote.tipo_planta}</p>
            </div>
          )}

          {lote.observacoes && (
            <div className="mt-4 rounded-lg border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Observações
              </p>
              <p className="mt-1 whitespace-pre-line text-sm">
                {lote.observacoes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planta</CardTitle>
        </CardHeader>
        <CardContent>
          {lote.planta_url ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
              <Image
                src={lote.planta_url}
                alt="Planta do lote"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
              <p className="text-sm">Sem planta enviada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
