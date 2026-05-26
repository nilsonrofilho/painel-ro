import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { QuadraForm } from "@/components/forms/quadra-form";
import { getLoteamento } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NovaQuadraPage({ params }: Props) {
  const { id } = await params;
  const loteamento = await getLoteamento(id);
  if (!loteamento) notFound();

  return (
    <>
      <div className="mb-4 space-y-2">
        <Breadcrumb
          items={[
            { label: "Loteamentos", href: "/loteamentos" },
            { label: loteamento.nome, href: `/loteamentos/${id}` },
            { label: "Nova quadra" },
          ]}
        />
        <BackButton href={`/loteamentos/${id}`} />
      </div>
      <PageHeader
        title="Nova quadra"
        description={`Adicionar quadra ao loteamento "${loteamento.nome}"`}
      />
      <QuadraForm loteamentoId={id} />
    </>
  );
}
