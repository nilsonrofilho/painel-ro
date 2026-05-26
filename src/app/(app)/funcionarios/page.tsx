import Link from "next/link";
import Image from "next/image";
import { HardHat, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { getFuncionarios } from "@/lib/queries";
import { formatBRL } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TIPOS = {
  clt: "CLT",
  diarista: "Diarista",
  empreitada: "Empreitada",
} as const;

export default async function FuncionariosPage() {
  const funcionarios = await getFuncionarios();

  return (
    <>
      <PageHeader
        title="Funcionários"
        description={`${funcionarios.length} funcionário(s) cadastrado(s)`}
        actions={
          <Button asChild>
            <Link href="/funcionarios/novo">
              <Plus className="h-4 w-4" />
              Novo funcionário
            </Link>
          </Button>
        }
      />

      {funcionarios.length === 0 ? (
        <EmptyState
          icon={<HardHat className="h-7 w-7" />}
          title="Nenhum funcionário ainda"
          description="Cadastre seus pedreiros, mestres de obra e demais colaboradores."
          action={
            <Button asChild>
              <Link href="/funcionarios/novo">
                <Plus className="h-4 w-4" />
                Cadastrar primeiro
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {funcionarios.map((f) => (
            <Link key={f.id} href={`/funcionarios/${f.id}`} className="group">
              <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {f.foto_url ? (
                      <Image
                        src={f.foto_url}
                        alt={f.nome}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 font-semibold">{f.nome}</h3>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {f.funcao ?? "Função não informada"}
                      </p>
                    </div>
                    <Badge variant={f.status === "ativo" ? "success" : "muted"}>
                      {f.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {f.tipo_contratacao && (
                      <Badge variant="accent">
                        {TIPOS[f.tipo_contratacao]}
                      </Badge>
                    )}
                    {f.salario != null && (
                      <span>{formatBRL(f.salario)}/mês</span>
                    )}
                    {f.diaria != null && <span>{formatBRL(f.diaria)}/dia</span>}
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
