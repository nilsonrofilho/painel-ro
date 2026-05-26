import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Pencil, Phone, MapPin, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Breadcrumb } from "@/components/breadcrumb";
import { createClient } from "@/lib/supabase/server";
import type { Alocacao, Funcionario } from "@/lib/supabase/types";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { DeleteFuncionarioButton } from "./delete-button";

type AlocacaoComLote = Alocacao & {
  lote: {
    numero: string;
    quadra?: {
      identificador: string;
      loteamento?: { id: string; nome: string };
    };
  } | null;
};

export const dynamic = "force-dynamic";

const TIPOS = {
  clt: "CLT",
  diarista: "Diarista",
  empreitada: "Empreitada",
} as const;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FuncionarioDetalhePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: funcionarioRaw }, { data: alocacoesRaw }] = await Promise.all([
    supabase.from("funcionarios").select("*").eq("id", id).single(),
    supabase
      .from("alocacoes")
      .select(
        "*, lote:lotes(numero, quadra:quadras(identificador, loteamento:loteamentos(id, nome)))",
      )
      .eq("funcionario_id", id)
      .order("data_inicio", { ascending: false }),
  ]);
  const funcionario = funcionarioRaw as Funcionario | null;
  const alocacoes = (alocacoesRaw ?? []) as unknown as AlocacaoComLote[];
  if (!funcionario) notFound();

  return (
    <>
      <div className="mb-4">
        <Breadcrumb
          items={[
            { label: "Funcionários", href: "/funcionarios" },
            { label: funcionario.nome },
          ]}
        />
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {funcionario.foto_url ? (
              <Image
                src={funcionario.foto_url}
                alt={funcionario.nome}
                width={80}
                height={80}
                className="h-20 w-20 rounded-2xl object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <User className="h-10 w-10" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{funcionario.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {funcionario.funcao ?? "Função não informada"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={funcionario.status === "ativo" ? "success" : "muted"}>
                  {funcionario.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
                {funcionario.tipo_contratacao && (
                  <Badge variant="accent">
                    {TIPOS[funcionario.tipo_contratacao]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/funcionarios/${id}/editar`}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </Button>
            <DeleteFuncionarioButton id={id} nome={funcionario.nome} />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="font-medium">{funcionario.telefone ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Admissão</p>
              <p className="font-medium">
                {formatDateBR(funcionario.data_admissao)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Endereço</p>
              <p className="font-medium">{funcionario.endereco ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {funcionario.salario != null && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Salário</p>
              <p className="text-xl font-bold text-primary">
                {formatBRL(funcionario.salario)}
              </p>
            </CardContent>
          </Card>
        )}
        {funcionario.diaria != null && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Diária</p>
              <p className="text-xl font-bold text-primary">
                {formatBRL(funcionario.diaria)}
              </p>
            </CardContent>
          </Card>
        )}
        {funcionario.cpf && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">CPF</p>
              <p className="text-base font-medium">{funcionario.cpf}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Alocações em lotes ({alocacoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {alocacoes.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              Nenhuma alocação registrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alocacoes.map((a) => {
                  const lote = a.lote;
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Link
                          href={`/lotes/${a.lote_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          Lote {lote?.numero ?? "?"}
                        </Link>
                        <p className="text-[10px] text-muted-foreground">
                          {lote?.quadra?.loteamento?.nome ?? "—"} ·
                          Quadra {lote?.quadra?.identificador ?? "?"}
                        </p>
                      </TableCell>
                      <TableCell>{a.funcao_no_lote ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateBR(a.data_inicio)} →{" "}
                        {formatDateBR(a.data_fim)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatBRL(Number(a.valor_pago ?? 0))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
