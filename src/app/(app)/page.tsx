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
import {
  getOpcoesFiltro,
  parseFiltro,
  parsePeriodo,
  resolverPeriodo,
  type OpcaoLoteamento,
  type OpcaoLote,
} from "@/lib/filters";
import { FiltroLoteamentoLote } from "@/components/filtro-loteamento-lote";
import { FiltroPeriodo } from "@/components/filtro-periodo";
import { formatBRL, formatDateBR, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    loteamento?: string;
    lote?: string;
    periodo?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filtro = parseFiltro(sp);
  const periodo = resolverPeriodo(parsePeriodo(sp));
  const janela = { inicio: periodo.inicio, fim: periodo.fim };

  // Querystring base para preservar filtros nos links de drill-down
  const qs = new URLSearchParams();
  if (filtro.loteamentoId) qs.set("loteamento", filtro.loteamentoId);
  if (filtro.loteId) qs.set("lote", filtro.loteId);
  const sufixo = qs.toString() ? `?${qs.toString()}` : "";

  const [
    stats,
    statusDist,
    vendasMes,
    gastosLot,
    obrasAtrasadas,
    gastoMesAtual,
    ultimasVendas,
    opcoes,
  ] = await Promise.all([
    getDashboardStats(filtro, janela),
    getDistribuicaoStatusLotes(filtro),
    getVendasPorMes(12, filtro),
    getGastosPorLoteamento(filtro),
    getObrasAtrasadas(filtro),
    getGastosMesAtual(filtro, janela),
    getVendasUltimas(5, filtro),
    getOpcoesFiltro(),
  ]);

  const filtroAtivo = !!filtro.loteamentoId || !!filtro.loteId;
  const loteamentoNome = filtro.loteamentoId
    ? (opcoes.loteamentos as OpcaoLoteamento[]).find(
        (l) => l.id === filtro.loteamentoId,
      )?.nome
    : undefined;
  const loteNumero = filtro.loteId
    ? (opcoes.lotes as OpcaoLote[]).find((l) => l.id === filtro.loteId)?.numero
    : undefined;
  const descricaoFiltro = filtroAtivo
    ? [
        loteamentoNome ? `Loteamento: ${loteamentoNome}` : null,
        loteNumero ? `Lote ${loteNumero}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Visão geral da operação da RO Construções";

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={descricaoFiltro}
        actions={
          <Button asChild>
            <Link href="/gantt">
              <GanttChartSquare className="h-4 w-4" />
              Ver Gantt
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <FiltroLoteamentoLote
          loteamentos={opcoes.loteamentos}
          lotes={opcoes.lotes}
        />
        <FiltroPeriodo />
      </div>

      {/* KPIs principais */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KPICard
          label="Loteamentos"
          value={stats.totalLoteamentos}
          icon={<Building2 className="h-5 w-5" />}
          variant="primary"
          href="/loteamentos"
        />
        <KPICard
          label="Total de lotes"
          value={stats.total}
          icon={<Home className="h-5 w-5" />}
          href="/loteamentos"
        />
        <KPICard
          label="Disponíveis"
          value={stats.disponiveis}
          icon={<Home className="h-5 w-5" />}
          variant="success"
          href="/loteamentos"
        />
        <KPICard
          label="Reservados"
          value={stats.reservados}
          icon={<Home className="h-5 w-5" />}
          variant="warning"
          href="/loteamentos"
        />
        <KPICard
          label="Vendidos"
          value={stats.vendidos}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
          href="/loteamentos"
        />
        <KPICard
          label="% Vendido"
          value={formatPercent(stats.pctVendas, 1)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="accent"
        />
        <KPICard
          label={`Vendido — ${periodo.label.toLowerCase()}`}
          value={formatBRL(stats.valorMes)}
          hint={`${stats.vendasMes} venda(s)`}
          icon={<CircleDollarSign className="h-5 w-5" />}
          variant="primary"
          currency
          href={`/relatorios${sufixo}`}
        />
        <KPICard
          label={`Gasto — ${periodo.label.toLowerCase()}`}
          value={formatBRL(gastoMesAtual)}
          icon={<Wallet className="h-5 w-5" />}
          variant="destructive"
          currency
          href={`/relatorios${sufixo}`}
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
