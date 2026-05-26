import Link from "next/link";
import { Truck, Plus, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { getFornecedores } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CAT_LABELS = {
  material: "Material",
  servico: "Serviço",
  ambos: "Ambos",
} as const;

export default async function FornecedoresPage() {
  const fornecedores = await getFornecedores();
  return (
    <>
      <PageHeader
        title="Fornecedores"
        description={`${fornecedores.length} fornecedor(es) cadastrado(s)`}
        actions={
          <Button asChild>
            <Link href="/fornecedores/novo">
              <Plus className="h-4 w-4" />
              Novo fornecedor
            </Link>
          </Button>
        }
      />

      {fornecedores.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-7 w-7" />}
          title="Nenhum fornecedor ainda"
          description="Cadastre fornecedores de materiais e serviços usados nas obras."
          action={
            <Button asChild>
              <Link href="/fornecedores/novo">
                <Plus className="h-4 w-4" />
                Cadastrar primeiro
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fornecedores.map((f) => (
            <Link key={f.id} href={`/fornecedores/${f.id}`} className="group">
              <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 font-semibold">
                        {f.nome_fantasia ?? f.razao_social}
                      </h3>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {f.razao_social}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="accent">{CAT_LABELS[f.categoria]}</Badge>
                    {f.cnpj && (
                      <span className="text-muted-foreground">{f.cnpj}</span>
                    )}
                  </div>
                  {f.telefone && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {f.telefone}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
