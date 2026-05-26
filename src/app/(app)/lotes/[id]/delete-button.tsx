"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteLote } from "@/lib/actions/lotes";

export function DeleteLoteButton({ id, numero }: { id: string; numero: string }) {
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
        title={`Excluir Lote ${numero}?`}
        description="Todos os dados deste lote (vendas, fases, materiais, alocações, documentos) serão removidos permanentemente."
        confirmLabel="Sim, excluir"
        destructive
        onConfirm={async () => {
          try {
            await deleteLote(id);
            toast.success("Lote excluído");
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Erro ao excluir";
            toast.error(msg);
          }
        }}
      />
    </>
  );
}
