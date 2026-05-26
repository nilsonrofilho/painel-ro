import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { QuadraForm } from "@/components/forms/quadra-form";
import { getLoteamento, getQuadra } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; qid: string }>;
}

export default async function EditarQuadraPage({ params }: Props) {
  const { id, qid } = await params;
  const [loteamento, quadra] = await Promise.all([
    getLoteamento(id),
    getQuadra(qid),
  ]);
  if (!loteamento || !quadra) notFound();

  return (
    <>
      <div className="mb-4 space-y-2">
        <Breadcrumb
          items={[
            { label: "Loteamentos", href: "/loteamentos" },
            { label: loteamento.nome, href: `/loteamentos/${id}` },
            {
              label: `Quadra ${quadra.identificador}`,
              href: `/loteamentos/${id}/quadras/${qid}`,
            },
            { label: "Editar" },
          ]}
        />
        <BackButton href={`/loteamentos/${id}/quadras/${qid}`} />
      </div>
      <PageHeader
        title={`Editar Quadra ${quadra.identificador}`}
        description="Atualize as informações da quadra"
      />
      <QuadraForm loteamentoId={id} quadra={quadra} />
    </>
  );
}
