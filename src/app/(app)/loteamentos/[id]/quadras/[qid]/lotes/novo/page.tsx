import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { LoteForm } from "@/components/forms/lote-form";
import { getFuncionarios, getLoteamento, getQuadra } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; qid: string }>;
}

export default async function NovoLotePage({ params }: Props) {
  const { id, qid } = await params;
  const [loteamento, quadra, funcionarios] = await Promise.all([
    getLoteamento(id),
    getQuadra(qid),
    getFuncionarios(),
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
            { label: "Novo lote" },
          ]}
        />
        <BackButton href={`/loteamentos/${id}/quadras/${qid}`} />
      </div>
      <PageHeader
        title="Novo lote"
        description={`Quadra ${quadra.identificador} — ${loteamento.nome}`}
      />
      <LoteForm quadraId={qid} funcionarios={funcionarios} />
    </>
  );
}
