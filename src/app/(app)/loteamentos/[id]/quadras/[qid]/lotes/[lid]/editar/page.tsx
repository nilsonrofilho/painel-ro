import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { LoteForm } from "@/components/forms/lote-form";
import {
  getFuncionarios,
  getLote,
  getLoteamento,
  getQuadra,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; qid: string; lid: string }>;
}

export default async function EditarLotePage({ params }: Props) {
  const { id, qid, lid } = await params;
  const [loteamento, quadra, lote, funcionarios] = await Promise.all([
    getLoteamento(id),
    getQuadra(qid),
    getLote(lid),
    getFuncionarios(),
  ]);
  if (!loteamento || !quadra || !lote) notFound();
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
            { label: `Lote ${lote.numero}`, href: `/lotes/${lid}` },
            { label: "Editar" },
          ]}
        />
        <BackButton href={`/lotes/${lid}`} />
      </div>
      <PageHeader
        title={`Editar Lote ${lote.numero}`}
        description={`Quadra ${quadra.identificador} — ${loteamento.nome}`}
      />
      <LoteForm quadraId={qid} lote={lote} funcionarios={funcionarios} />
    </>
  );
}
