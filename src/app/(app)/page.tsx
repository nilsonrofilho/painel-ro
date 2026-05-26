import Link from "next/link";
import {
  Building2,
  Home,
  TrendingUp,
  Wallet,
  CircleDollarSign,
  AlertCircle,
  Calendar,
  GanttChartSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import {
  StatusPieChart,
  VendasMesChart,
  GastosLoteamentoChart,
} from "@/components/charts/dashboard-charts";
import { getDashboardStats, getVendasUltimas } from "@/lib/queries";
import {
  getDistribuicaoStatusLotes,
  getGastosMesAtual,
  getGastosPorLoteamento,
  getObrasAtrasadas,
  getVendasPorMes,
} from "@/lib/queries-extra";
import { formatBRL, formatDateBR, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    stats,
    statusDist,
    vendasMes,
    gastosLot,
    obrasAtrasadas,
    gastoMesAtual,
    ultimasVendas,
  ] = await Promise.all([
    getDashboardStats(),
    getDistribuicaoStatusLotes(),
    getVendasPorMes(12),
    getGastosPorLoteamento(),
    getObrasAtrasadas(),
    getGastosMesAtual(),
    getVendasUltimas(5),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação da RO Construções"
        actions={
          <Button asChild>
            <Link href="/gantt">
              <GanttChartSquare className="h-4 w-4" />
              Ver Gantt
            </Link>
          </Button>
        }
      />

      {/* KPIs principais */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KPICard
          label="Loteamentos"
          value={stats.totalLoteamentos}
          icon={<Building2 className="h-5 w-5" />}
          variant="primary"
        />
        <KPICard
          label="Total de lotes"
          value={stats.total}
          icon={<Home className="h-5 w-5" />}
        />
        <KPICard
          label="Disponíveis"
          value={stats.disponiveis}
          icon={<Home className="h-5 w-5" />}
          variant="success"
        />
        <KPICard
          label="Reservados"
          value={stats.reservados}
          icon={<Home className="h-5 w-5" />}
          variant="warning"
        />
        <KPICard
          label="Vendidos"
          value={stats.vendidos}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
        />
        <KPICard
          label="% Vendido"
          value={formatPercent(stats.pctVendas, 1)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="accent"
        />
        <KPICard
          label="Vendido no mês"
          value={formatBRL(stats.valorMes)}
          hint={`${stats.vendasMes} venda(s)`}
          icon={<CircleDollarSign className="h-5 w-5" />}
          variant="primary"
        />
        <KPICard
          label="Gasto no mês"
          value={formatBRL(gastoMesAtual)}
          icon={<Wallet className="h-5 w-5" />}
          variant="destructive"
        />
      </div>

      {/* Gráficos */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status dos lotes</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusDist} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Vendas — últimos 12 meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VendasMesChart data={vendasMes} />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Gastos por loteamento (acumulado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GastosLoteamentoChart data={gastosLot} />
        </CardContent>
      </Card>

      {/* Listas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDollarSign className="h-4 w-4 text-primary" />
              Últimas vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimasVendas.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Nenhuma venda registrada ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {ultimasVendas.map((v) => {
                  const ctx = v.lote;
                  return (
                    <li
                      key={v.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {v.cliente_nome ?? "—"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Lote {ctx?.numero ?? "?"} ·{" "}
                          {ctx?.quadra?.loteamento?.nome ?? "?"} ·{" "}
                          {formatDateBR(v.data)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {v.valor ? formatBRL(v.valor) : "—"}
                        </p>
                        <Badge
                          variant={v.tipo === "venda" ? "default" : "warning"}
                          className="mt-1"
                        >
                          {v.tipo === "venda" ? "Venda" : "Reserva"}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Obras atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obrasAtrasadas.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Nenhuma obra atrasada. 👍
              </p>
            ) : (
              <ul className="space-y-2">
                {obrasAtrasadas.map((o) => {
                  const ctx = o.quadra;
                  return (
                    <li
                      key={o.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                    >
                      <Link
                        href={`/lotes/${o.id}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="truncate font-medium text-foreground">
                          Lote {o.numero} — Quadra {ctx?.identificador ?? "?"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {ctx?.loteamento?.nome ?? "?"}
                        </p>
                      </Link>
                      <div className="text-right">
                        <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                          <Calendar className="h-3 w-3" />
                          {formatDateBR(o.previsao_entrega)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
