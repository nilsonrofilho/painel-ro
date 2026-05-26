import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import { LoteamentoCard } from "@/components/loteamento-card";
import { getLoteamentos } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LoteamentosPage() {
  const loteamentos = await getLoteamentos();

  return (
    <>
      <PageHeader
        title="Loteamentos"
        description={`${loteamentos.length} loteamento(s) cadastrado(s)`}
        actions={
          <Button asChild>
            <Link href="/loteamentos/novo">
              <Plus className="h-4 w-4" />
              Novo loteamento
            </Link>
          </Button>
        }
      />

      {loteamentos.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" />}
          title="Nenhum loteamento ainda"
          description="Comece criando seu primeiro loteamento. Depois você pode adicionar quadras e lotes."
          action={
            <Button asChild>
              <Link href="/loteamentos/novo">
                <Plus className="h-4 w-4" />
                Criar primeiro loteamento
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loteamentos.map((lot) => (
            <LoteamentoCard key={lot.id} loteamento={lot} />
          ))}
        </div>
      )}
    </>
  );
}
