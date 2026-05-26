import { BackButton } from "@/components/back-button";
import { PageHeader } from "@/components/page-header";
import { LoteamentoForm } from "@/components/forms/loteamento-form";
import { getFuncionarios } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NovoLoteamentoPage() {
  const funcionarios = await getFuncionarios();
  return (
    <>
      <div className="mb-4">
        <BackButton href="/loteamentos" />
      </div>
      <PageHeader
        title="Novo loteamento"
        description="Cadastre um novo empreendimento da RO"
      />
      <LoteamentoForm funcionarios={funcionarios} />
    </>
  );
}
