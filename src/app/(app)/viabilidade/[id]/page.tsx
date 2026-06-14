import { notFound } from "next/navigation";
import {
  Landmark,
  Map,
  Ruler,
  Boxes,
  Wallet,
  Percent,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb } from "@/components/breadcrumb";
import { BackButton } from "@/components/back-button";
import {
  getViabilidade,
  getViabilidadeProgramas,
  getViabilidadeCustos,
  getViabilidadeFluxo,
  getZonas,
  getZona,
  getMunicipiosParametros,
  getCubVigente,
} from "@/lib/queries";
import { STATUS_VIABILIDADE, TIPO_EMPREENDIMENTO } from "@/lib/constants";
import { EstudoActions } from "./actions";
import { TerrenoTab } from "./tabs/terreno";
import { TecnicaTab } from "./tabs/tecnica";
import { ProgramaTab } from "./tabs/programa";
import { CustosTab } from "./tabs/custos";
import { FinanciamentoTab } from "./tabs/financiamento";
import { RetornoTab } from "./tabs/retorno";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ViabilidadeDetalhePage({ params }: Props) {
  const { id } = await params;
  const estudo = await getViabilidade(id);
  if (!estudo) notFound();

  const [programas, custos, fluxo, zona, municipios] = await Promise.all([
    getViabilidadeProgramas(id),
    getViabilidadeCustos(id),
    getViabilidadeFluxo(id),
    estudo.zona_id ? getZona(estudo.zona_id) : Promise.resolve(null),
    getMunicipiosParametros(),
  ]);

  const zonasDoMunicipio = estudo.municipio
    ? await getZonas(estudo.municipio)
    : [];

  const cub = estudo.estado
    ? await getCubVigente(
        estudo.estado,
        estudo.padrao_construcao ?? "normal",
        estudo.tipo_projeto_cub ?? "R1",
      )
    : null;
  const cubM2 = estudo.cub_valor_m2 ?? cub?.valor_m2 ?? 0;

  const cfg = STATUS_VIABILIDADE[estudo.status];

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <BackButton href="/viabilidade" />
        <Breadcrumb
          items={[
            { label: "Viabilidade", href: "/viabilidade" },
            { label: estudo.nome },
          ]}
        />
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{estudo.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {[estudo.municipio, estudo.estado].filter(Boolean).join(" / ") ||
                  "Localização não informada"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
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
                <Badge variant="accent">
                  {TIPO_EMPREENDIMENTO[estudo.tipo_empreendimento]}
                </Badge>
                {estudo.area_terreno_m2 != null && (
                  <span className="text-sm text-muted-foreground">
                    {estudo.area_terreno_m2} m²
                  </span>
                )}
              </div>
            </div>
          </div>
          <EstudoActions estudo={estudo} />
        </CardContent>
      </Card>

      <Tabs defaultValue="terreno">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="terreno" icon={<Map className="h-4 w-4" />}>
            Terreno
          </TabsTrigger>
          <TabsTrigger value="tecnica" icon={<Ruler className="h-4 w-4" />}>
            Técnica
          </TabsTrigger>
          <TabsTrigger value="programa" icon={<Boxes className="h-4 w-4" />}>
            Programa
          </TabsTrigger>
          <TabsTrigger value="custos" icon={<Wallet className="h-4 w-4" />}>
            Custos
          </TabsTrigger>
          <TabsTrigger value="financiamento" icon={<Percent className="h-4 w-4" />}>
            Financiamento
          </TabsTrigger>
          <TabsTrigger value="retorno" icon={<TrendingUp className="h-4 w-4" />}>
            Retorno
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terreno">
          <TerrenoTab
            estudo={estudo}
            zonas={zonasDoMunicipio}
            municipios={municipios}
          />
        </TabsContent>
        <TabsContent value="tecnica">
          <TecnicaTab estudo={estudo} zona={zona} />
        </TabsContent>
        <TabsContent value="programa">
          <ProgramaTab estudo={estudo} programas={programas} />
        </TabsContent>
        <TabsContent value="custos">
          <CustosTab
            estudo={estudo}
            custos={custos}
            programas={programas}
            municipios={municipios}
            cubM2={cubM2}
          />
        </TabsContent>
        <TabsContent value="financiamento">
          <FinanciamentoTab estudo={estudo} />
        </TabsContent>
        <TabsContent value="retorno">
          <RetornoTab
            estudo={estudo}
            programas={programas}
            custos={custos}
            fluxo={fluxo}
            cubM2={cubM2}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
