import { Wallet, TrendingDown, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import { ResumoEtapasChart } from "@/components/charts/resumo-etapas-chart";
import { FiltroLoteamentoLote } from "@/components/filtro-loteamento-lote";
import { getFasesTodosLotes } from "@/lib/queries";
import { getOpcoesFiltro, parseFiltro } from "@/lib/filters";
import { formatBRL } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ loteamento?: string; lote?: string }>;
}

export default async function RelatoriosPage({ searchParams }: Props) {
  const filtro = parseFiltro(await searchParams);
  const [etapas, opcoes] = await Promise.all([
    getFasesTodosLotes(filtro),
    getOpcoesFiltro(),
  ]);

  const totalOrcado = etapas.reduce((s, e) => s + e.orcamento, 0);
  const totalGasto = etapas.reduce((s, e) => s + e.gasto, 0);
  const saldo = totalOrcado - totalGasto;

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Resumo financeiro consolidado por etapa da obra"
      />

      <div className="mb-6">
        <FiltroLoteamentoLote
          loteamentos={opcoes.loteamentos}
          lotes={opcoes.lotes}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KPICard
          label="Total orçado"
          value={formatBRL(totalOrcado)}
          icon={<Wallet className="h-5 w-5" />}
          variant="primary"
        />
        <KPICard
          label="Total gasto"
          value={formatBRL(totalGasto)}
          icon={<TrendingDown className="h-5 w-5" />}
          variant={saldo < 0 ? "destructive" : "default"}
        />
        <KPICard
          label="Saldo"
          value={formatBRL(saldo)}
          icon={<Layers className="h-5 w-5" />}
          variant={saldo < 0 ? "destructive" : "success"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumoEtapasChart
            etapas={etapas}
            emptyMessage="Nenhuma fase de obra cadastrada nos lotes deste filtro. Cadastre fases na aba Fases da obra dos lotes."
          />
        </CardContent>
      </Card>
    </>
  );
}
