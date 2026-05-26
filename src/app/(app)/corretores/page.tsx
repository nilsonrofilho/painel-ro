import { UserCog, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCorretores } from "@/lib/queries";
import { CorretoresActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function CorretoresPage() {
  const corretores = await getCorretores();
  return (
    <>
      <PageHeader
        title="Corretores"
        description={`${corretores.length} corretor(es) cadastrado(s)`}
        actions={<CorretoresActions />}
      />

      {corretores.length === 0 ? (
        <EmptyState
          icon={<UserCog className="h-7 w-7" />}
          title="Nenhum corretor ainda"
          description="Cadastre corretores para registrar comissões nas vendas."
          action={<CorretoresActions trigger="empty" />}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lista</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CRECI</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="text-right">Comissão padrão</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {corretores.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.creci ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{c.telefone ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.email ?? "—"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {c.comissao_padrao_pct != null
                        ? `${c.comissao_padrao_pct}%`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <CorretoresActions corretor={c} trigger="row" />
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
