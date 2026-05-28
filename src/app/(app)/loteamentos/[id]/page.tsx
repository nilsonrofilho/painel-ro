import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Plus,
  Layers,
  MapPin,
  Calendar,
  Pencil,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Breadcrumb } from "@/components/breadcrumb";
import { BackButton } from "@/components/back-button";
import { PageHeader } from "@/components/page-header";
import { QuadraCard } from "@/components/quadra-card";
import { StatusLoteamentoBadge } from "@/components/status-badge";
import { KPICard } from "@/components/kpi-card";
import { getLoteamento, getQuadrasDoLoteamento } from "@/lib/queries";
import { formatDateBR } from "@/lib/utils";
import { DeleteLoteamentoButton } from "./delete-button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LoteamentoDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const [loteamento, quadras] = await Promise.all([
    getLoteamento(id),
    getQuadrasDoLoteamento(id),
  ]);

  if (!loteamento) notFound();

  const totals = quadras.reduce(
    (acc, q) => {
      acc.lotes += q.total_lotes;
      acc.disponiveis += q.disponiveis;
      acc.reservados += q.reservados;
      acc.vendidos += q.vendidos;
      return acc;
    },
    { lotes: 0, disponiveis: 0, reservados: 0, vendidos: 0 },
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <BackButton />
        <Breadcrumb
          items={[
            { label: "Loteamentos", href: "/loteamentos" },
            { label: loteamento.nome },
          ]}
        />
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 md:aspect-auto">
            {loteamento.imagem_url ? (
              <Image
                src={loteamento.imagem_url}
                alt={loteamento.nome}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 280px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Building2 className="h-16 w-16 text-primary/40" />
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <StatusLoteamentoBadge
                  status={loteamento.status ?? "planejamento"}
                />
                <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                  {loteamento.nome}
                </h1>
                {(loteamento.cidade || loteamento.estado) && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {[loteamento.cidade, loteamento.estado]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/loteamentos/${id}/editar`}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                <DeleteLoteamentoButton id={id} nome={loteamento.nome} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Início
                </p>
                <p className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3 w-3" />
                  {formatDateBR(loteamento.data_inicio)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Previsão
                </p>
                <p className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3 w-3" />
                  {formatDateBR(loteamento.previsao_entrega)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Quadras
                </p>
                <p className="font-medium">{quadras.length}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Lotes
                </p>
                <p className="font-medium">{totals.lotes}</p>
              </div>
            </div>

            {loteamento.descricao && (
              <Card className="mt-4 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-sm text-foreground">{loteamento.descricao}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          label="Disponíveis"
          value={totals.disponiveis}
          variant="success"
        />
        <KPICard
          label="Reservados"
          value={totals.reservados}
          variant="warning"
        />
        <KPICard label="Vendidos" value={totals.vendidos} variant="primary" />
        <KPICard label="Total" value={totals.lotes} />
      </div>

      <PageHeader
        title="Quadras"
        description={`${quadras.length} quadra(s) cadastrada(s)`}
        actions={
          <Button asChild>
            <Link href={`/loteamentos/${id}/quadras/nova`}>
              <Plus className="h-4 w-4" />
              Nova quadra
            </Link>
          </Button>
        }
      />

      {quadras.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-7 w-7" />}
          title="Nenhuma quadra ainda"
          description="Adicione a primeira quadra do loteamento para começar a cadastrar lotes."
          action={
            <Button asChild>
              <Link href={`/loteamentos/${id}/quadras/nova`}>
                <Plus className="h-4 w-4" />
                Criar primeira quadra
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quadras.map((q) => (
            <QuadraCard
              key={q.id}
              quadra={q}
              href={`/loteamentos/${id}/quadras/${q.id}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
