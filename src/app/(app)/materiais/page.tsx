import Link from "next/link";
import { Package, AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMateriaisComEstoque } from "@/lib/queries";
import { formatBRL } from "@/lib/utils";
import { MaterialActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function MateriaisPage() {
  const materiais = await getMateriaisComEstoque();
  const abaixoMinimo = materiais.filter((m) => m.abaixo_minimo).length;

  return (
    <>
      <PageHeader
        title="Materiais"
        description={`Catálogo e estoque (${materiais.length} material(is))`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/curva-abc">
                <BarChart3 className="h-4 w-4" />
                Curva ABC
              </Link>
            </Button>
            <MaterialActions />
          </div>
        }
      />

      {abaixoMinimo > 0 && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {abaixoMinimo} material(is) abaixo do estoque mínimo.
        </div>
      )}

      {materiais.length === 0 ? (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="Nenhum material no catálogo"
          description="Cadastre materiais aqui para selecioná-los nos lançamentos do lote e acompanhar o estoque."
          action={<MaterialActions trigger="empty" />}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catálogo e estoque</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Preço ref.</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiais.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <p className="font-medium">{m.nome}</p>
                      {m.observacao && (
                        <p className="text-[10px] text-muted-foreground">
                          {m.observacao}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.categoria ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{m.unidade ?? "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {m.preco_referencia ? formatBRL(m.preco_referencia) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          m.abaixo_minimo
                            ? "font-bold text-warning"
                            : "font-medium"
                        }
                      >
                        {m.saldo_estoque} {m.unidade ?? ""}
                      </span>
                      {m.abaixo_minimo && (
                        <AlertTriangle className="ml-1 inline h-3 w-3 text-warning" />
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {m.estoque_minimo ? m.estoque_minimo : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.ativo ? "success" : "muted"}>
                        {m.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <MaterialActions material={m} trigger="row" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="mt-3 px-1 text-xs text-muted-foreground">
        O estoque é calculado pelas entradas e saídas lançadas nos lotes que
        referenciam o material do catálogo.
      </p>
    </>
  );
}
