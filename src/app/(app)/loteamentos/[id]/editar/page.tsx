import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { PageHeader } from "@/components/page-header";
import { LoteamentoForm } from "@/components/forms/loteamento-form";
import { getFuncionarios, getLoteamento } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarLoteamentoPage({ params }: Props) {
  const { id } = await params;
  const [loteamento, funcionarios] = await Promise.all([
    getLoteamento(id),
    getFuncionarios(),
  ]);
  if (!loteamento) notFound();
  return (
    <>
      <div className="mb-4">
        <BackButton href={`/loteamentos/${id}`} />
      </div>
      <PageHeader
        title={`Editar: ${loteamento.nome}`}
        description="Atualize os dados do loteamento"
      />
      <LoteamentoForm loteamento={loteamento} funcionarios={funcionarios} />
    </>
  );
}
