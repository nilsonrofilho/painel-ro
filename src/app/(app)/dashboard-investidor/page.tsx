import Link from "next/link";
import { Users, TrendingUp, Wallet, PieChart as PieIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import { StatusPieChart } from "@/components/charts/dashboard-charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getDashboardInvestidor } from "@/lib/queries";
import { formatBRL } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CORES = [
  "hsl(220, 79%, 45%)",
  "hsl(5, 64%, 48%)",
  "hsl(160, 64%, 42%)",
  "hsl(35, 90%, 52%)",
  "hsl(265, 55%, 55%)",
  "hsl(190, 70%, 48%)",
  "hsl(217, 16%, 55%)",
];

export default async function DashboardInvestidorPage() {
  const d = await getDashboardInvestidor();

  const pieData = d.porLoteamento.map((l, i) => ({
    nome: l.nome,
    valor: l.valor,
    cor: CORES[i % CORES.length],
  }));

  return (
    <>
      <PageHeader
        title="Dashboard Investidor"
        description="Visão consolidada de todos os investimentos"
        actions={
          <Button asChild variant="outline">
            <Link href="/investidores">
              <Users className="h-4 w-4" />
              Ver investidores
            </Link>
          </Button>
        }
      />

      {d.qtdInvestidores === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Nenhum investidor cadastrado"
          description="Cadastre investidores e seus aportes para ver o consolidado aqui."
          action={
            <Button asChild>
              <Link href="/investidores">Ir para Investidores</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KPICard
              label="Total captado"
              value={formatBRL(d.totalCaptado)}
              variant="primary"
              currency
              icon={<Wallet className="h-5 w-5" />}
            />
            <KPICard
              label="Retorno projetado"
              value={formatBRL(d.retornoProjetado)}
              variant="success"
              currency
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <KPICard
              label="Investidores"
              value={d.qtdInvestidores}
              icon={<Users className="h-5 w-5" />}
            />
            <KPICard label="Aportes (lotes)" value={d.qtdAportes} />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieIcon className="h-4 w-4 text-primary" />
                  Captação por loteamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusPieChart data={pieData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranking de investidores</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investidor</TableHead>
                      <TableHead className="text-right">Investido</TableHead>
                      <TableHead className="text-right">Retorno proj.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.porInvestidor.map((i) => (
                      <TableRow key={i.nome}>
                        <TableCell className="font-medium">{i.nome}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatBRL(i.valor)}
                        </TableCell>
                        <TableCell className="text-right text-success">
                          {formatBRL(i.retorno)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
