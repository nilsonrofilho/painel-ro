import { PageHeader } from "@/components/page-header";
import { FiltroLoteamentoLote } from "@/components/filtro-loteamento-lote";
import {
  getLancamentosFinanceiros,
  getResumoFinanceiro,
  getDRELinhas,
  getCorretores,
  getFornecedores,
} from "@/lib/queries";
import { getOpcoesFiltro, parseFiltro } from "@/lib/filters";
import { FinanceiroClient } from "./financeiro-client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ loteamento?: string; lote?: string }>;
}

export default async function FinanceiroPage({ searchParams }: Props) {
  const filtro = parseFiltro(await searchParams);
  const [lancamentos, resumo, dreLinhas, fornecedores, corretores, opcoes] =
    await Promise.all([
      getLancamentosFinanceiros(filtro),
      getResumoFinanceiro(filtro),
      getDRELinhas(filtro),
      getFornecedores(),
      getCorretores(),
      getOpcoesFiltro(),
    ]);

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Contas a pagar e receber, fluxo de caixa e DRE gerencial"
      />
      <div className="mb-6">
        <FiltroLoteamentoLote
          loteamentos={opcoes.loteamentos}
          lotes={opcoes.lotes}
        />
      </div>
      <FinanceiroClient
        lancamentos={lancamentos}
        resumo={resumo}
        dreLinhas={dreLinhas}
        fornecedores={fornecedores}
        corretores={corretores}
        opcoes={opcoes}
      />
    </>
  );
}
