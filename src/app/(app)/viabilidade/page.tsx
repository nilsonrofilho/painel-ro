import Link from "next/link";
import { Landmark, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import { getViabilidades } from "@/lib/queries";
import { STATUS_VIABILIDADE, TIPO_EMPREENDIMENTO } from "@/lib/constants";
import { formatBRL } from "@/lib/utils";
import { NovoEstudoButton } from "./novo-button";

export const dynamic = "force-dynamic";

export default async function ViabilidadePage() {
  const estudos = await getViabilidades();

  return (
    <>
      <PageHeader
        title="Estudos de Viabilidade"
        description={`${estudos.length} estudo(s) de viabilidade econômica`}
        actions={<NovoEstudoButton />}
      />

      {estudos.length === 0 ? (
        <EmptyState
          icon={<Landmark className="h-7 w-7" />}
          title="Nenhum estudo ainda"
          description="Crie um estudo de viabilidade para analisar a aquisição de um terreno: potencial construtivo, ITBI, custos, VGV e retorno."
          action={<NovoEstudoButton variant="empty" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {estudos.map((e) => {
            const cfg = STATUS_VIABILIDADE[e.status];
            return (
              <Link
                key={e.id}
                href={`/viabilidade/${e.id}`}
                className="group"
              >
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <Badge
                        variant={
                          cfg.color === "success"
                            ? "success"
                            : cfg.color === "destructive"
                              ? "destructive"
                              : "muted"
                        }
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                    <h3 className="mt-3 line-clamp-1 font-semibold">{e.nome}</h3>
                    {(e.municipio || e.estado) && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[e.municipio, e.estado].filter(Boolean).join(" / ")}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="accent">
                        {TIPO_EMPREENDIMENTO[e.tipo_empreendimento]}
                      </Badge>
                      {e.area_terreno_m2 != null && (
                        <span className="text-muted-foreground">
                          {e.area_terreno_m2} m²
                        </span>
                      )}
                    </div>
                    {e.custo_terreno != null && e.custo_terreno > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Terreno:{" "}
                        <span className="font-medium text-foreground">
                          {formatBRL(e.custo_terreno)}
                        </span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
