"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteFornecedor } from "@/lib/actions/fornecedores";

export function DeleteFornecedorButton({
  id,
  nome,
}: {
  id: string;
  nome: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Excluir "${nome}"?`}
        description="Todos os preços cadastrados serão removidos. Os lançamentos de material vinculados perderão a referência ao fornecedor."
        destructive
        confirmLabel="Sim, excluir"
        onConfirm={async () => {
          try {
            await deleteFornecedor(id);
            toast.success("Fornecedor excluído");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro");
          }
        }}
      />
    </>
  );
}
