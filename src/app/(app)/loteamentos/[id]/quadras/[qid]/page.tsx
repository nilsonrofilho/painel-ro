import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Home, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import { LoteCard } from "@/components/lote-card";
import { getLoteamento, getQuadra, getLotesDaQuadra } from "@/lib/queries";
import { DeleteQuadraButton } from "./delete-button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; qid: string }>;
}

export default async function QuadraDetalhePage({ params }: Props) {
  const { id, qid } = await params;
  const [loteamento, quadra, lotes] = await Promise.all([
    getLoteamento(id),
    getQuadra(qid),
    getLotesDaQuadra(qid),
  ]);
  if (!loteamento || !quadra) notFound();

  const totals = lotes.reduce(
    (acc, l) => {
      acc.total += 1;
      if (l.status === "disponivel") acc.disponiveis += 1;
      if (l.status === "reservado") acc.reservados += 1;
      if (l.status === "vendido") acc.vendidos += 1;
      return acc;
    },
    { total: 0, disponiveis: 0, reservados: 0, vendidos: 0 },
  );

  return (
    <>
      <div className="mb-4">
        <Breadcrumb
          items={[
            { label: "Loteamentos", href: "/loteamentos" },
            { label: loteamento.nome, href: `/loteamentos/${id}` },
            { label: `Quadra ${quadra.identificador}` },
          ]}
        />
      </div>

      <Card className="mb-6">
        <CardContent className="flex items-start gap-4 p-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
            {quadra.identificador}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              Quadra {quadra.identificador}
            </h1>
            {quadra.descricao && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {quadra.descricao}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/loteamentos/${id}/quadras/${qid}/editar`}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </Button>
            <DeleteQuadraButton
              id={qid}
              identificador={quadra.identificador}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard label="Disponíveis" value={totals.disponiveis} variant="success" />
        <KPICard label="Reservados" value={totals.reservados} variant="warning" />
        <KPICard label="Vendidos" value={totals.vendidos} variant="primary" />
        <KPICard label="Total" value={totals.total} />
      </div>

      <PageHeader
        title="Lotes"
        description={`${lotes.length} lote(s) na quadra ${quadra.identificador}`}
        actions={
          <Button asChild>
            <Link
              href={`/loteamentos/${id}/quadras/${qid}/lotes/novo`}
            >
              <Plus className="h-4 w-4" />
              Novo lote
            </Link>
          </Button>
        }
      />

      {lotes.length === 0 ? (
        <EmptyState
          icon={<Home className="h-7 w-7" />}
          title="Nenhum lote ainda"
          description="Adicione o primeiro lote desta quadra."
          action={
            <Button asChild>
              <Link href={`/loteamentos/${id}/quadras/${qid}/lotes/novo`}>
                <Plus className="h-4 w-4" />
                Adicionar lote
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {lotes.map((l) => (
            <LoteCard key={l.id} lote={l} />
          ))}
        </div>
      )}
    </>
  );
}
