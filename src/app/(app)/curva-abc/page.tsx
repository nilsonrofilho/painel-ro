import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FiltroLoteamentoLote } from "@/components/filtro-loteamento-lote";
import { getCurvaABCMateriais } from "@/lib/queries";
import { getOpcoesFiltro, parseFiltro } from "@/lib/filters";
import { formatBRL, formatPercent } from "@/lib/utils";
import { ParetoChart } from "./pareto";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ loteamento?: string; lote?: string }>;
}

const CLASSE_BADGE: Record<string, "default" | "warning" | "muted"> = {
  A: "default",
  B: "warning",
  C: "muted",
};

export default async function CurvaABCPage({ searchParams }: Props) {
  const filtro = parseFiltro(await searchParams);
  const [itens, opcoes] = await Promise.all([
    getCurvaABCMateriais(filtro),
    getOpcoesFiltro(),
  ]);

  const total = itens.reduce((s, i) => s + i.valor, 0);
  const qtdA = itens.filter((i) => i.classe === "A").length;
  const valorA = itens
    .filter((i) => i.classe === "A")
    .reduce((s, i) => s + i.valor, 0);

  return (
    <>
      <PageHeader
        title="Curva ABC"
        description="Classificação de materiais por participação no gasto"
      />

      <div className="mb-6">
        <FiltroLoteamentoLote
          loteamentos={opcoes.loteamentos}
          lotes={opcoes.lotes}
        />
      </div>

      {itens.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-7 w-7" />}
          title="Sem dados para a curva ABC"
          description="Lance saídas de material nos lotes para classificar os itens por participação no custo."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KPICard label="Gasto total" value={formatBRL(total)} variant="primary" currency />
            <KPICard label="Itens" value={itens.length} />
            <KPICard
              label="Classe A"
              value={`${qtdA} itens`}
              hint={`${formatPercent(total > 0 ? (valorA / total) * 100 : 0, 0)} do gasto`}
              variant="accent"
            />
            <KPICard
              label="Concentração A"
              value={formatPercent(total > 0 ? (valorA / total) * 100 : 0, 1)}
            />
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Diagrama de Pareto</CardTitle>
            </CardHeader>
            <CardContent>
              <ParetoChart itens={itens} />
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(220, 79%, 45%)" }} />
                  A — até 80% do gasto
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(35, 90%, 52%)" }} />
                  B — 80% a 95%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(217, 16%, 60%)" }} />
                  C — 95% a 100%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classificação</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classe</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Gasto</TableHead>
                    <TableHead className="text-right">% do total</TableHead>
                    <TableHead className="text-right">% acumulado</TableHead>
                    <TableHead className="text-right">Lançamentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((i) => (
                    <TableRow key={i.material}>
                      <TableCell>
                        <Badge variant={CLASSE_BADGE[i.classe]}>{i.classe}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{i.material}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatBRL(i.valor)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(i.pct, 1)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatPercent(i.pct_acumulado, 1)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {i.qtd_lancamentos}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
