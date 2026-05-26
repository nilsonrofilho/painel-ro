import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Mail, Phone, MapPin, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/breadcrumb";
import { createClient } from "@/lib/supabase/server";
import type { Fornecedor, FornecedorPreco } from "@/lib/supabase/types";
import { PrecosManager } from "./precos-manager";
import { DeleteFornecedorButton } from "./delete-button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const CAT_LABELS = {
  material: "Material",
  servico: "Serviço",
  ambos: "Ambos",
} as const;

export default async function FornecedorDetalhePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: fornecedorRaw }, { data: precosRaw }] = await Promise.all([
    supabase.from("fornecedores").select("*").eq("id", id).single(),
    supabase
      .from("fornecedor_precos")
      .select("*")
      .eq("fornecedor_id", id)
      .order("atualizado_em", { ascending: false }),
  ]);
  const fornecedor = fornecedorRaw as Fornecedor | null;
  const precos = (precosRaw ?? []) as FornecedorPreco[];
  if (!fornecedor) notFound();

  return (
    <>
      <div className="mb-4">
        <Breadcrumb
          items={[
            { label: "Fornecedores", href: "/fornecedores" },
            { label: fornecedor.nome_fantasia ?? fornecedor.razao_social },
          ]}
        />
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {fornecedor.nome_fantasia ?? fornecedor.razao_social}
              </h1>
              {fornecedor.nome_fantasia && (
                <p className="text-sm text-muted-foreground">
                  {fornecedor.razao_social}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="accent">{CAT_LABELS[fornecedor.categoria]}</Badge>
                {fornecedor.cnpj && (
                  <span className="text-muted-foreground">{fornecedor.cnpj}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/fornecedores/${id}/editar`}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </Button>
            <DeleteFornecedorButton id={id} nome={fornecedor.razao_social} />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="font-medium">{fornecedor.telefone ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="font-medium">{fornecedor.email ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Endereço</p>
              <p className="font-medium">{fornecedor.endereco ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {fornecedor.observacao && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm">{fornecedor.observacao}</p>
          </CardContent>
        </Card>
      )}

      <PrecosManager fornecedorId={id} precos={precos ?? []} />
    </>
  );
}
