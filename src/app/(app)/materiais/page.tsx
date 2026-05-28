import { Package, Plus } from "lucide-react";
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
import { getMateriaisCatalogo } from "@/lib/queries";
import { formatBRL } from "@/lib/utils";
import { MaterialActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function MateriaisPage() {
  const materiais = await getMateriaisCatalogo();
  return (
    <>
      <PageHeader
        title="Materiais"
        description={`Catálogo global de materiais usados nas obras (${materiais.length} cadastrado(s))`}
        actions={<MaterialActions />}
      />

      {materiais.length === 0 ? (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="Nenhum material no catálogo"
          description="Cadastre materiais aqui para selecioná-los rapidamente nos lançamentos do lote, mantendo nomes e unidades consistentes."
          action={<MaterialActions trigger="empty" />}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catálogo</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Preço ref.</TableHead>
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
                      {m.preco_referencia
                        ? formatBRL(m.preco_referencia)
                        : "—"}
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
    </>
  );
}
